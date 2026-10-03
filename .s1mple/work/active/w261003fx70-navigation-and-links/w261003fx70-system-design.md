# W261003FX70: Navigation and links — System Design

**Design Status:** Finalized System Design

**Context Source:** `w261003fx70-discuss-context.md`

**Requirements Source:** `w261003fx70-requirements.md`

**Research Source:** None

**Current Requirement Revisions:** W261003FX70-REQ1@R1, W261003FX70-REQ2@R1, W261003FX70-REQ3@R1, W261003FX70-REQ4@R1, W261003FX70-REQ5@R1, W261003FX70-REQ6@R1, W261003FX70-REQ7@R1, W261003FX70-REQ8@R1, W261003FX70-REQ9@R1

**Research Reconciliation:** None — research skipped

**Unresolved Items:** None

**Design Boundary:** This artifact is authoritative for whole-system architecture and technical design, including UI/frontend applications, routes, modules, components, state ownership, contracts, files, symbols, boundaries, wiring, and verification when material. UI/UX look and feel, visual composition, concrete interaction treatment, responsive presentation, accessibility realization, mockups, and accepted UI-design authority belong to `s1mple-discuss-ui`.

**Finalized System Design Checklist:**

- [x] Every current qualified requirement revision has exactly one valid system-design coverage outcome: `System design required`, `No system design change`, or `No system design applicable`.
- [x] Every `System design required` outcome has the full `REQ → DES → S → V` chain.
- [x] Every `No system design change` outcome cites the existing system mechanism, exact current source, and existing verification evidence.
- [x] Every `No system design applicable` outcome explains why the requirement creates no system architecture or technical-design obligation and omits invented `DES`, `S`, and `V` records.
- [x] For roadmap-linked work, the accepted baseline has been checked against current parent definitions, every assigned parent obligation has valid child coverage, and gates due before design approval have evidence.
- [x] Historical requirement revisions are excluded from current design coverage.
- [x] When research exists, every RF-to-evaluated-revision relationship is reconciled and evaluated-versus-informed lineage is accurate; a finding that evaluated no requirement has one `None` relationship row.
- [x] When any requirement requires changed system design, the design progresses from system context and architecture to concrete files and symbols; otherwise sections 2–8 record explicit non-applicability without inventing system changes.
- [x] Every focal component, when any, has an existing target or proposed location and clear ownership.
- [x] The proposed project tree accounts for every affected source, wiring, configuration, migration, and test file as added, modified, renamed/moved, or deleted, or states why no system file changes apply.
- [x] Every changed or proposed logical contract, data model, and state item has a canonical section 7 detailed-shape reference; every unchanged item cites its exact current source and identifies affected section 7 consumers when relevant.
- [x] Every changed boundary has a contract, state rule, or signature.
- [x] Every modified symbol has an exact current source, current → final delta, and affected callers or consumers.
- [x] Detailed code design covers every important changed type, class, function, dependency, invariant, focused control flow, construction point, registration, and export; each code preview is immediately followed by an explanation of the definitions shown and how they interact.
- [x] Changed runtime flows name the participating symbols and define relevant failure policies.
- [x] Every cross-cutting, migration, and delivery concern is resolved with a concrete design location or `None — <reason>`.
- [x] Every `System design required` requirement, every design decision, and every changed invariant maps to an observable success criterion and an exact verification case and assertion.
- [x] Test suites and nested cases form one verification tree; every case names its unique risk and uses the lowest sufficient test level.
- [x] Unit and integration tests follow the section 8 quality rules without duplicating the same proof across levels.
- [x] Traceability is complete for every `System design required` outcome: `current REQ revision → DES → affected file → affected symbol → caller or wiring → runtime flow → success criterion → suite or check → exact verification case and assertion`; other outcomes have their required evidence instead of fabricated links.
- [x] UI/frontend technical design stays within the Design Boundary; UI/UX realization is deferred to `s1mple-discuss-ui`.
- [x] Every omitted structure, code preview, test level, or non-test check explains why it does not apply.

**Approval evidence:** Self-drive of this discussion approved by the user on 2026-10-03. Under that delegation the agent finalized decisions W261003FX70-DES1 … W261003FX70-DES10 below.

# Table of Contents

1. [Design Goals, Constraints, and Requirement Coverage](#1-design-goals-constraints-and-requirement-coverage)
2. [System Context and Architecture](#2-system-context-and-architecture)
3. [Components and Boundaries](#3-components-and-boundaries)
4. [Project Structure Changes](#4-project-structure-changes)
5. [Runtime Flows and Error Policies](#5-runtime-flows-and-error-policies)
6. [Logical Contracts, Data Models, and State](#6-logical-contracts-data-models-and-state)
7. [Detailed Code Design](#7-detailed-code-design)
8. [Testing and Verification](#8-testing-and-verification)
9. [Finalized Design Decisions](#9-finalized-design-decisions)
   - [W261003FX70-DES1: State, action, and effect protocol additions](#w261003fx70-des1-state-action-and-effect-protocol-additions)
   - [W261003FX70-DES2: Two-level Markdown model](#w261003fx70-des2-two-level-markdown-model)
   - [W261003FX70-DES3: Links core](#w261003fx70-des3-links-core)
   - [W261003FX70-DES4: Index worker and host](#w261003fx70-des4-index-worker-and-host)
   - [W261003FX70-DES5: Index freshness on the main thread](#w261003fx70-des5-index-freshness-on-the-main-thread)
   - [W261003FX70-DES6: Link-safe edit pipeline](#w261003fx70-des6-link-safe-edit-pipeline)
   - [W261003FX70-DES7: Configuration](#w261003fx70-des7-configuration)
   - [W261003FX70-DES8: Navigation state and session](#w261003fx70-des8-navigation-state-and-session)
   - [W261003FX70-DES9: Discovery and link UI](#w261003fx70-des9-discovery-and-link-ui)
   - [W261003FX70-DES10: Benchmarks and CI](#w261003fx70-des10-benchmarks-and-ci)

# 1. Design Goals, Constraints, and Requirement Coverage

## Goals

- Deliver every RM261003ABZP-DI2@R2 obligation on top of the merged DI1 contracts, extending them only additively (W261003FX70-REQ1@R1).
- Keep the 10,000-note budgets by construction: whole-document facts come from a linear scan, mdast is lazy per block, and the index is built off the main thread (W261003FX70-REQ3@R1, W261003FX70-REQ4@R1).
- Make every link edit safe: plans are pure, closed files are re-validated at write time, and every resolved link keeps its target (W261003FX70-REQ6@R1).
- Keep keys, config, and discovery registration-driven: one effective keymap derived from defaults, file-type bindings, and config; one pure picker source model (W261003FX70-REQ7@R1, W261003FX70-REQ9@R1).
- Persist navigation outside the workspace with Neovim semantics (W261003FX70-REQ8@R1).

## Requirement Coverage

- `W261003FX70-REQ1@R1` — Inherited DI2 obligations
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003FX70-DES1`, `W261003FX70-DES2`, `W261003FX70-DES3`, `W261003FX70-DES4`, `W261003FX70-DES6`, `W261003FX70-DES7`, `W261003FX70-DES8`, `W261003FX70-DES9`, `W261003FX70-DES10`
  - **How Addressed:** Each parent DES and verification record maps to a decision here (Assigned Parent Obligation Coverage). DES1 keeps the protocol additive. DES9 binds note keys only in the `markdown` scope. DES4 keeps the worker protocol's meaning and adds optional fields only.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/types.ts` — `AppState`, `Action`, `Effect`, `Overlay`, `TimerId`; `src/core/state/update.ts` — `createUpdate`, `Registries`; plus every file listed in section 4
  - **Callers and Wiring:** `src/app/main.ts` — `registries`, `main`
  - **Runtime Flow:** Startup and indexing; Key routing and discovery; Rename or move with link rewrite; Follow, complete, and inspect links
  - **Success Criteria:** S1, S5, S6, S15, S18, S20
  - **Verification:** V8, V22, V42, V43, V44, V45, V46, V48, V49, V52
  - **Research Support:** None

- `W261003FX70-REQ2@R1` — Added dependencies and pins
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003FX70-DES2`, `W261003FX70-DES7`
  - **How Addressed:** `package.json` adds the six Markdown packages and `toml-eslint-parser` 1.0.3 at exact versions. `test/boundaries.test.ts` gains a per-package import allowlist. `src/core/config/toml.ts` turns parser locations into `config.toml:<line>` errors.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `package.json` — `dependencies`; `bun.lock`; `test/boundaries.test.ts` — `PACKAGE_HOMES`; `src/core/config/toml.ts` — `parseConfig`
  - **Callers and Wiring:** `src/core/lang/markdown/{scan,mdast}.ts` import the Markdown packages; `src/app/effects.ts` and `src/app/main.ts` call `parseConfig`
  - **Runtime Flow:** Config load and reload
  - **Success Criteria:** S13, S19
  - **Verification:** V17, V18, V35, V53, V55
  - **Research Support:** None

- `W261003FX70-REQ3@R1` — Two-level Markdown model within the performance budgets
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003FX70-DES2`, `W261003FX70-DES10`
  - **How Addressed:** `splitBlocks` feeds both a linear `scanBlock` and a lazy `blockNode`. `syntaxExtensions` defines each Obsidian syntax once, for both levels. `parseDoc(buf, prev)` reuses blocks by hash and is the `markdown` file type's `analyze`, computed in `update`. The bench gate proves the budgets.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/lang/markdown/{blocks,syntax,scan,doc,mdast,file-type}.ts`; `src/core/state/buffers.ts` — `withAnalysis`; `src/ui/editors/text-view.ts` — `rows`
  - **Callers and Wiring:** `FileTypeRegistry` registration in `src/app/main.ts`; `src/core/state/buffers.ts`; `src/workspace/index-worker.ts`
  - **Runtime Flow:** Edit to analysis; Startup and indexing
  - **Success Criteria:** S2, S3, S4, S5
  - **Verification:** V1, V2, V3, V4, V5, V6, V7, V49, V50, V51
  - **Research Support:** None

- `W261003FX70-REQ4@R1` — Index worker packaging and lifecycle
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003FX70-DES4`, `W261003FX70-DES10`
  - **How Addressed:**
    - `createIndexHost` spawns the worker with `new URL("../workspace/index-worker.ts", import.meta.url)` after the first frame, and restarts it once after a crash.
    - Every compile command lists the worker as a second entrypoint, and `test/repo.test.ts` enforces it.
    - A PTY test runs the compiled binary until `index ready`.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/app/index-host.ts` — `createIndexHost`; `src/workspace/index-worker.ts`; `package.json` — `scripts.build`; `.github/workflows/release.yml` — build step; `knip.json` — `entry`
  - **Callers and Wiring:** `src/app/main.ts` post-first-frame block
  - **Runtime Flow:** Startup and indexing; Worker failure
  - **Success Criteria:** S5, S11
  - **Verification:** V36, V47, V49, V50, V52, V56
  - **Research Support:** None

- `W261003FX70-REQ5@R1` — Index freshness
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003FX70-DES5`
  - **How Addressed:** `src/core/state/index.ts` updates the NoteIndex on the main thread from `saved`, a successful `fsResult`, `editsApplied`, and the watcher's `removed` and `changed` events for non-note files. Note changes made by other programs reach the worker through `IndexHost.notify`. Current-note features read `buffers[].analysis.scan`.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/index.ts` — `onIndexBatch`, `summarizeSaved`, `indexAfterFsOp`; `src/core/state/save.ts` — `onSaved`; `src/core/state/explorer.ts` — `onFsResult`; `src/core/state/disk.ts` — `onFileChanged`
  - **Callers and Wiring:** `src/core/state/update.ts` switch; `src/app/main.ts` watcher callback
  - **Runtime Flow:** Index freshness
  - **Success Criteria:** S12
  - **Verification:** V25, V37
  - **Research Support:** None

- `W261003FX70-REQ6@R1` — Link-safe rename, move, and link-mention edits
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003FX70-DES3`, `W261003FX70-DES6`
  - **How Addressed:**
    - `planRename(ix, moves, open)` returns `FileEdit[]` with expected span text, enforcing the resolution invariant.
    - The prompt shows the impact before the user confirms. The file operation runs first.
    - On success, open buffers are edited as one undo step and each closed file gets one `applyEdits` effect, which the runner validates span by span before an atomic write.
    - While the index is building, the operation is refused. When the index is unavailable, the prompt warns and the operation renames the file only.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/features/links/{rename,mentions,summarize,note-index,resolve}.ts`; `src/core/state/link-edits.ts`; `src/core/state/explorer.ts` — `startOp`, `submit`, `promptKey`, `onFsResult`; `src/app/effects.ts` — `applyEdits` case
  - **Callers and Wiring:** explorer `r`/`m`, `file.rename` (`<leader>lr`), `file.move`, side panel `l` → `link.linkMention`
  - **Runtime Flow:** Rename or move with link rewrite; Link a mention
  - **Success Criteria:** S7, S8, S9, S10
  - **Verification:** V11, V12, V13, V14, V15, V24, V34, V38
  - **Research Support:** None

- `W261003FX70-REQ7@R1` — Configuration file, errors, reload, and debug log
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003FX70-DES7`
  - **How Addressed:**
    - `configPath` applies the XDG rule, and `parseConfig` validates against a strict zod schema with lines taken from the TOML AST.
    - `onConfigLoaded` validates bindings against the registries, then applies the config or keeps the previous one and shows a toast.
    - `keymapFor(reg, config)` derives the effective keymap, including the leader. `:ConfigReload` emits `loadConfig`.
    - `createLogger` writes `so.log` only when `SO_LOG=debug`.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/config/{schema,toml}.ts`; `src/core/state/{config,keymap}.ts`; `src/core/kernel/commands/keymap.ts` — `Keymap`; `src/core/kernel/vim/keys.ts` — `splitKeys`; `src/workspace/{config-file,log}.ts`; `src/ui/{shell,theme}.ts`
  - **Callers and Wiring:** `src/app/main.ts` startup; `src/app/effects.ts` `loadConfig`
  - **Runtime Flow:** Config load and reload
  - **Success Criteria:** S13, S14, S15
  - **Verification:** V17, V18, V19, V20, V31, V33, V39, V41
  - **Research Support:** None

- `W261003FX70-REQ8@R1` — Jump list, recent files, and session restore
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003FX70-DES8`
  - **How Addressed:**
    - The engine emits a `jumped` VimEffect for Neovim's jump motions, and the navigation helpers push jumps.
    - `jumps.ts` implements the list, capped at 100 entries.
    - `session.ts` snapshots and restores layout, recents, and jumps.
    - `state-file.ts` stores them at the hashed XDG state path with mode `0600`.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/kernel/vim/{types,engine}.ts`; `src/core/state/{jumps,recent,session}.ts`; `src/workspace/state-file.ts`; `src/app/{main,lifecycle}.ts`; `test/vim/{cases.ts,expected.json}`
  - **Callers and Wiring:** `applyVimEffects`, `openPath`, picker accept, `link.follow`; `installLifecycle` shutdown
  - **Runtime Flow:** Jump navigation; Session save and restore
  - **Success Criteria:** S16
  - **Verification:** V26, V27, V28, V32, V40
  - **Research Support:** None

- `W261003FX70-REQ9@R1` — Picker matching, preview, and search limits
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003FX70-DES3`, `W261003FX70-DES9`
  - **How Addressed:**
    - `fuzzyScore` implements fzf v1 scoring with smart-case.
    - The `PickerSource` registry ranks items.
    - Grep goes through a 100 ms `search` timer to the worker; results are capped at 1,000, and stale ids are dropped.
    - Previews are requested with `readPreview` only at ≥ 100 columns and are painted by `paintPreview` in source view.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/kernel/text/fuzzy.ts`; `src/core/state/picker.ts`; `src/ui/overlays/picker.ts`; `src/workspace/index-worker.ts` — `search`
  - **Callers and Wiring:** `file.find`, `file.recent`, `search.*`, `command.palette`, and `help.keymap` commands; `OverlayHost`
  - **Runtime Flow:** Picker query, search, and preview
  - **Success Criteria:** S17
  - **Verification:** V16, V29, V34, V42
  - **Research Support:** None

## Assigned Parent Obligation Coverage

- **Parent Baseline**
  - **Binding:** `w261003fx70-discuss-context.md`, Roadmap Binding (commit `3f01513`)
  - **Assessment:** Aligned. On 2026-10-03 the index (`rm261003abzp-roadmap-index.md:132`, `:143`) and phase file (`rm261003abzp-roadmap-phase-1-daily-usable-editor.md:429-517`) still name RM261003ABZP-DI2@R2 with the bound REQ, DES, S, V, and UI revisions. The refinements below change no contract consumed by DI3 or DI4 and are reported for parent synchronization.
  - **Design Approval Gates:** G1 (`…phase-1…md:73`) met — DI1 merged to `main` as `c98aa19` (PR #1) with CI green. G2 and G3 (`rm261003abzp-roadmap-phase-2-obsidian-experience.md:70-71`) are produced by this Work and not due before design approval.

- **Navigation, commands, configuration, and state**
  - **Parent:** RM261003ABZP-REQ3@R4; RM261003ABZP-DES5@R2; RM261003ABZP-DES14@R1; RM261003ABZP-S3@R1 / RM261003ABZP-V4@R2
  - **Work Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ7@R1, W261003FX70-REQ8@R1, W261003FX70-REQ9@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003FX70-DES7, W261003FX70-DES8, W261003FX70-DES9
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S13, S15, S16, S17
  - **Verification:** V17–V22, V26–V29, V31, V39, V40, V42
  - **Treatment:** Refined.
    - The TOML parser changes from `Bun.TOML.parse` to `toml-eslint-parser`, because Bun reports no TOML line (requirements, Discussion Evidence).
    - The keymap is derived per config, so `:ConfigReload` works without a registry rebuild.
    - The `editor.*` options are deferred to parent assignment. Every other DES14@R1 behaviour is inherited.

- **Links, backlinks, tags, and rename**
  - **Parent:** RM261003ABZP-REQ4@R3; RM261003ABZP-DES7@R3; RM261003ABZP-DES6@R1; RM261003ABZP-DES8@R2 (rename and link-mention writes); RM261003ABZP-S4@R1 / RM261003ABZP-V5@R1, RM261003ABZP-V6@R2
  - **Work Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ3@R1, W261003FX70-REQ5@R1, W261003FX70-REQ6@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003FX70-DES2, W261003FX70-DES3, W261003FX70-DES5, W261003FX70-DES6
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S2, S6, S7, S8, S9, S10, S12
  - **Verification:** V2–V4, V8–V15, V24, V25, V37, V38
  - **Treatment:** Refined. The resolution order and format preservation are inherited unchanged.
    - `planRename` takes link spans from summaries and open-buffer scans instead of a synchronous `read` callback.
    - Closed-file edits go through a validated `applyEdits` effect, which writes through `atomicWrite` exactly as DES8@R2 requires.
    - The fuzzy module moves to the language-neutral kernel.

- **Markdown parse and syntax registration**
  - **Parent:** RM261003ABZP-DES6@R1; RM261003ABZP-REQ11@R3 (`syntaxExtensions`); RM261003ABZP-DES17@R1 (`markdown` `analyze`)
  - **Work Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ3@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003FX70-DES2
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S2, S3, S4
  - **Verification:** V1–V7
  - **Treatment:** Refined. `parseDoc` with the block cache and the `syntaxExtensions` registry is delivered as required. The index summarizes from the scan level, and mdast is parsed lazily per block, because a full parse misses the V13 and `openFile` budgets (11.8 s for 10,000 notes; about 350 ms for the 5,000-line note).

- **Startup and index performance**
  - **Parent:** RM261003ABZP-REQ9@R2 (startup and index part); RM261003ABZP-DES16@R1; RM261003ABZP-S9@R1 / RM261003ABZP-V13@R1
  - **Work Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ3@R1, W261003FX70-REQ4@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003FX70-DES2, W261003FX70-DES4, W261003FX70-DES10
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S5
  - **Verification:** V49, V50, V51
  - **Treatment:** Inherited. The parent gate mechanism (median of 5, fail above 2× target) is unchanged; new targets are registered.

- **Overlays and side panel**
  - **Parent:** RM261003ABZP-DES10@R2 (overlays, side panel)
  - **Work Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ9@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003FX70-DES9
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S15, S17, S18
  - **Verification:** V42–V46
  - **Treatment:** Refined. Picker sources live in pure core (`src/core/state/picker.ts`), so filtering and accept are reducer transitions. `src/ui/overlays/picker.ts` paints rows and previews. This realizes the UI design's `PickerSource` contract (`rm261003abzp-ui-design.md:1404-1416`) without UI-side state.

- **Worker off the input path; text search within the open policy**
  - **Parent:** RM261003ABZP-DES16@R1 (worker); RM261003ABZP-DES17@R1 (search limits)
  - **Work Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ4@R1, W261003FX70-REQ9@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003FX70-DES4
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S5, S11, S17
  - **Verification:** V34, V36, V47, V50
  - **Treatment:** Inherited. The phase-file protocol semantics are kept, with optional additive fields only.

- **UI obligations**
  - **Parent:** RM261003ABZP-M3@R1, RM261003ABZP-M4@R1 (S1–S9, S18), RM261003ABZP-M1@R1 (panel and indexing states), manifest AD4; RM261003ABZP-UREQ5@R2, UREQ6@R1, UREQ1@R2, UREQ7@R2, UREQ11@R1; RM261003ABZP-UDES5@R2, UDES6@R1, UDES1@R2, UDES7@R2, UDES11@R1; RM261003ABZP-US3@R2 / UV4@R2, US4@R1 / UV5@R1, US1@R2 / UV1@R2 (DI2 states), US5@R2 / UV6@R2 (move impact), US9@R1 / UV10@R1 (picker selection)
  - **Work Requirements:** W261003FX70-REQ1@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003FX70-DES9
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S15, S18
  - **Verification:** V42, V43, V44, V45, V46
  - **Treatment:** Inherited. This design supplies the modules, state, and wiring. Visual realization follows the accepted UI design and is assessed after finalization.

- **Cross-work integration and gate outputs**
  - **Parent:** `…phase-1…md:591` (re-pass RM261003ABZP-V1@R1, V17@R1, V18@R1); G2 and G3 outputs (`…phase-2…md:70-71`)
  - **Work Requirements:** W261003FX70-REQ1@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003FX70-DES1, W261003FX70-DES2, W261003FX70-DES3, W261003FX70-DES9
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S1, S20
  - **Verification:** V48, V52
  - **Treatment:** Inherited. The DI1 suites stay in `test:ci` unchanged. The G2 and G3 outputs (`parseDoc`, `syntaxExtensions`, `markdownFileType.analyze`, Markdown key scope, NoteIndex with `resolveLink`, statusline segments, Picker with preview, Prompt, `search` and `write` effects) are the files in section 4.

### Parent Synchronization

- **Discussion update:** Pending parent synchronization. No parent file is edited by this Work without explicit authorization.

  | # | Parent path and location | Proposed change | Evidence |
  |---|---|---|---|
  | 1 | `rm261003abzp-roadmap-index.md:132`, `:143`; `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:627` | DI2 Work `Pending` → `W261003FX70`; stage → Discuss (system design finalized) | context commit `3f01513`, requirements commit `4ea6ace`, this design's commit |
  | 2 | `rm261003abzp-design.md:1250` (RM261003ABZP-DES14@R1) | Config parser `Bun.TOML.parse` → `toml-eslint-parser` 1.0.3 | requirements Discussion Evidence (Bun reports the JS call site, not the TOML line) |
  | 3 | `rm261003abzp-design.md:378`, `:590` (DES6@R1, DES7@R3 wiring) | Index summaries come from the scan level of `parseDoc`; mdast is lazy per block | 11.8 s for 10,000 notes; ~350 ms for the `openFile` fixture |
  | 4 | `rm261003abzp-design.md:710`; `…phase-1…md:221-222` | `planRename(ix, moves, open)` without `read`; additive Actions `indexFailed`, `editsApplied`, `previewLoaded`; additive Effects `loadConfig`, `applyEdits`, `readPreview`; TimerId `whichKey`, `saveState`, `search` | DES1, DES6 |
  | 5 | `rm261003abzp-design.md` DES15@R2 build command; `…phase-1…md:132` | Every `bun build --compile` lists `src/workspace/index-worker.ts` as a second entrypoint | requirements Discussion Evidence (single-entrypoint binary drops the worker) |
  | 6 | `rm261003abzp-design.md:426` (AppConfig `editor.*`) | Assign `editor.tabWidth`, `editor.wrap`, `editor.relativeNumbers` to RM261003ABZP-DI3@R2 | no DI scope assigns them; DI2 rejects them as unknown keys |
  | 7 | `…phase-1…md:141` | Fuzzy matching lives at `src/core/kernel/text/fuzzy.ts` (palette and pickers use it, so it is not link-specific) | DES3 |
  | 8 | `…phase-1…md:259-267` | Worker messages gain optional fields: `batch.files`, `search.mode`/`names`/`exclude`, `results.capped` | DES4 |
  | 9 | `rm261003abzp-design.md` DES5@R2 command ids | The save command id is `file.save` (V4 (b) binds it); DI1's `buffer.write` is renamed | V4@R2 scenario (b) |

## Binding Constraints

- `test/boundaries.test.ts:9-42` — `src/core` stays pure; `src/core/kernel` imports nothing outside the kernel and no packages; `src/workspace` (including the worker) may import `src/core`. DES2, DES4, and DES7 place every new file within these rules.
- `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:511-516` — the resolution order, rename format preservation, and worker protocol semantics are fixed. The index is never persisted, and note keys stay in the `markdown` scope.
- `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:188-192` — new AppState fields are exactly the DI2 list; additive Actions and Effects are reported (DES1).
- `rm261003abzp-design.md:408` — derived NoteIndex maps are rebuilt only for changed paths (DES3 `applySummaries`).
- `rm261003abzp-design.md:428` — an invalid config file is ignored as a whole (DES7 `onConfigLoaded`).
- `src/core/state/update.ts:28-66` — `update` is pure and synchronous, and a thrown handler keeps the previous state. Every DES adds cases here and nowhere else.
- `src/app/effects.ts:66-73` — every mutating file-system effect shares one serial chain; `applyEdits` joins it (DES6).
- `src/workspace/watcher.ts:22-28` — own writes are suppressed by exact stamp; `applyEdits` calls `noteWrite` (DES6). The suppression also makes DES5 necessary.
- `scripts/bench-gate.ts:7-8` — targets and the 2× gate (DES10).
- `.s1mple/S1MPLE.md` Implementation — no work-process identifiers in code.

## Cross-Cutting Applicability

| Concern | Applicability | Design Location or Reason |
|---|---|---|
| Security and privacy | Applicable | The state file and log are written outside the workspace (`$XDG_STATE_HOME/so/`), the state file with mode `0600` (`src/workspace/state-file.ts` `saveStateFile`; V32). The log never contains note text (`src/workspace/log.ts`; V41). Grep is literal, so a regular-expression denial of service is impossible (`index-worker.ts` `searchFile`; V34). Link edits are validated against expected text before writing (`applyEdits`; V38). |
| Configuration | Applicable | DES7: `configPath`, `parseConfig`, `ConfigSchema`, `onConfigLoaded`, `keymapFor`, `:ConfigReload`; V17–V20, V31, V39. |
| Observability | Applicable | `SO_LOG=debug` → `createLogger` in `src/workspace/log.ts`, used by `src/app/{main,effects,index-host}.ts` for startup, config errors, worker crashes and restarts, index ready (count and ms), and effect failures; V33, V41. Index status is also user-visible in the statusline (V44). |
| Performance and scalability | Applicable | DES2 two-level parse; DES4 worker batching (500 summaries per batch); DES9 viewport-only preview; DES10 bench targets `firstFrame`, `indexReady`, `indexingKeystrokeP95`; V49–V51. |
| Concurrency | Applicable | The worker runs off the main thread with message passing only (DES4). Search ids drop stale results (DES9). `applyEdits` runs on the serial file-system queue behind the rename that produced it (DES6), and `follow` re-paths queued writes. |
| Retry and idempotency | Applicable | The worker restarts once (DES4; V36). `applyEdits` checks the expected text, so a repeated or stale edit is skipped rather than applied twice (DES6; V38). State saves are whole-file atomic replacements (DES8). |
| Migration and rollout | Applicable | The state file starts at `"version": 1`, and missing, corrupt, or unknown versions load as empty (DES8; V32). DI1's `buffer.write` id is renamed to `file.save`; no user config exists before DI2, so nothing migrates. See Migration and Delivery. |

## Focused Code Surface

- **Existing:**
  - `src/core/state/types.ts` — `AppState`, `Action`, `Effect`, `Overlay`, `PromptState`, `TimerId` — the protocol DI2 extends.
  - `src/core/state/update.ts` — `Registries`, `createUpdate` — registries injected once; DI2 replaces `keymap` with derived keymaps.
  - `src/core/state/keys.ts` — `handleKeyAction`, `applyVimEffects`, `cmdlineCompletions` — key routing, where which-key, pickers, completion, and jumps hook in.
  - `src/core/state/commands.ts` — `EX_ALIASES`, `runCommand`, `executeEx`, `builtins` — command ids, ex aliases, and the unavailable notice.
  - `src/core/state/explorer.ts` — `startOp`, `submit`, `onFsResult` — rename and move entry points.
  - `src/core/kernel/commands/keymap.ts` — `Keymap` — the trie that gains a leader.
  - `src/core/kernel/vim/{keys,engine,types}.ts` — `splitKeys`, `moveCursor`, `VimEffect` — leader resolution and jump signals.
  - `src/core/lang/markdown/file-type.ts` — `markdownFileType` — gains `analyze`.
  - `src/core/config/schema.ts` — `ConfigSchema` — grows to DI2 keys and becomes strict.
  - `src/app/{main,effects,lifecycle}.ts` — composition root, effect runner, shutdown.
  - `src/ui/{shell,theme}.ts`, `src/ui/editors/text-view.ts`, `src/ui/views/statusline.ts`, `src/ui/overlays/host.ts` — the views that read the new state.
- **Proposed:**
  - `src/core/lang/markdown/{blocks,syntax,scan,doc,mdast}.ts` — `splitBlocks`, `syntaxExtensions`, `scanBlock`, `parseDoc`, `blockNode` — Traces to `W261003FX70-DES2`
  - `src/core/features/links/{summarize,note-index,resolve,rename,mentions,link-at,commands}.ts` — Traces to `W261003FX70-DES3`
  - `src/core/kernel/text/fuzzy.ts` — `fuzzyScore`, `rankBy` — Traces to `W261003FX70-DES3`
  - `src/workspace/index-worker.ts`, `src/app/index-host.ts` — Traces to `W261003FX70-DES4`
  - `src/core/state/index.ts` — Traces to `W261003FX70-DES5`
  - `src/core/state/link-edits.ts`, `applyEdits` in `src/app/effects.ts` — Traces to `W261003FX70-DES6`
  - `src/core/config/toml.ts`, `src/core/state/{config,keymap}.ts`, `src/workspace/{config-file,log}.ts` — Traces to `W261003FX70-DES7`
  - `src/core/state/{jumps,recent,session}.ts`, `src/workspace/state-file.ts` — Traces to `W261003FX70-DES8`
  - `src/core/state/{whichkey,picker,completion,side-panel}.ts`, `src/ui/overlays/{whichkey,picker,completion}.ts`, `src/ui/views/side-panel.ts` — Traces to `W261003FX70-DES9`
  - `test/bench/{startup,indexing-keystroke}.bench.ts`, `scripts/bench-gate.ts` — Traces to `W261003FX70-DES10`

# 2. System Context and Architecture

## System Context

```text
              keys, resize                      config.toml (read)        state.json, so.log (read/write)
Terminal user ───────────► so (one Bun process) ◄──── $XDG_CONFIG_HOME/so ────  $XDG_STATE_HOME/so/<hash>/
     ▲  frames (OpenTUI)        │   ▲                                         (outside the workspace)
     └──────────────────────────┘   │ messages
                                    ▼
                         index worker (Bun Worker thread)
                                    │ read only
                                    ▼
             workspace folder (user's notes and text files) ◄── atomic writes, renames, trash (main thread only)
                                    ▲
                     fs.watch events (other programs' changes)
```

`so` stays one process. The new actor is a worker thread that only reads the workspace. Everything else `so` writes lands either in user files through the existing atomic path or under the XDG state directory.

## Proposed Architecture

```text
src/app/main.ts ── loadConfigText + parseConfig → dispatch configLoaded ─┐
   │               readStateFile → dispatch stateLoaded ─────────────────┤ before the first frame
   │                                                                     ▼
   ├─ createStore(initialState, createUpdate(reg), runner.run) ──► src/ui/shell (views, OverlayHost[prompt, conflict,
   │                         │                                         whichKey, picker, completion], SidePanel)
   │                         ▼ effects
   ├─ src/app/effects.ts: read │ write │ fs ops │ applyEdits │ readPreview │ loadConfig │ saveState │ search ─┐
   │                                                                                                         │
   └─ setImmediate (after first frame): watchWorkspace ─► dispatch fileChanged + indexHost.notify(event)     │
                                        createIndexHost ◄────────────── search ──────────────────────────────┘
                                           │ new Worker(new URL("../workspace/index-worker.ts", import.meta.url))
                                           ▼
                           src/workspace/index-worker.ts: scan(ExclusionMatcher) → readTextFile → scanDoc
                                → summarize → batch{files, summaries} │ search(text | mentions) → results

core (pure):
  state/{update, keys, commands, index, link-edits, picker, whichkey, completion, side-panel, jumps, recent, session,
         config, keymap, status}
     │ uses
     ├─ features/links/{summarize, note-index, resolve, rename, mentions, link-at, commands}
     ├─ lang/markdown/{blocks, syntax, scan, doc, mdast, file-type}     (scan: linear; mdast: lazy per block)
     ├─ config/{schema, toml}
     └─ kernel/{commands/keymap (leader), vim (jumped effect), text/fuzzy}
```

The architecture adds one rule: **cost decides where work runs**. Whole-workspace work (scanning, summarizing, text search) runs in the worker. Whole-document work on the main thread is limited to the linear scan. The expensive mdast parse runs only for blocks that are requested. Pure planning (resolution, rename, ranking) stays in core, so the reducer remains testable without I/O.

The major tradeoff is two parse levels instead of one. One `syntaxExtensions` registry feeding both levels, and a conformance test, contain that cost.

# 3. Components and Boundaries

## Markdown model

- **Target:** `src/core/lang/markdown/`
- **Kind:** pure module (language registration)
- **Responsibilities:**
  - Split a buffer into blocks and scan each block for frontmatter, headings, links, tags, and block ids, skipping code, math, and comments.
  - Parse one block to mdast on request, cached by hash.
  - Provide `parseDoc` as the `markdown` file type's `analyze`, plus the `syntaxExtensions` registry.
- **Collaborators:**

  ```text
  markdownFileType.analyze = parseDoc → splitBlocks → scanBlock(syntaxExtensions) → Doc.scan
  blockNode(block) → mdast-util-from-markdown(gfm, math) → syntaxExtensions[].transform
  ```

- **Boundary Contract:** section 6, `Doc` and `DocScan`
- **Detailed Design:** section 7, `src/core/lang/markdown/*`
- **Must Not Own:**
  - Link resolution, index maps, rendering, or file I/O.

## Links core

- **Target:** `src/core/features/links/`
- **Kind:** pure module (feature)
- **Responsibilities:**
  - Summarize a scan into a `NoteSummary`.
  - Maintain the immutable `NoteIndex` and its derived maps.
  - Resolve links, produce shortest link text, plan renames and mention edits, find the link at the cursor, and register link commands and Markdown-scoped bindings.
- **Collaborators:**

  ```text
  summarize(path, mtime, DocScan) → NoteSummary → applySummaries(NoteIndex) → resolveLink / backlinksOf
  planRename(NoteIndex, moves, open scans) → FileEdit[]      linkMentionEdit(NoteIndex, target, hit) → FileEdit
  ```

- **Boundary Contract:** section 6, `NoteSummary`, `NoteIndex`, `FileEdit`
- **Detailed Design:** section 7, `src/core/features/links/*`
- **Must Not Own:**
  - Reading or writing files, or deciding when edits apply (that is `state/link-edits.ts`).

## Index worker and host

- **Target:** `src/workspace/index-worker.ts`, `src/app/index-host.ts`
- **Kind:** adapter (thread entry) and app wiring
- **Responsibilities:**
  - **Worker:** scan non-excluded files, summarize notes in batches, answer text and mention searches, and re-summarize notes on `changed` messages. It never writes.
  - **Host:** spawn the worker after the first frame, translate messages to actions, forward watcher events, restart once, and log.
- **Collaborators:**

  ```text
  IndexHost.start(root) → Worker → FromWorker → store.dispatch(indexBatch | indexReady | searchResults | indexFailed)
  runner search effect → IndexHost.search(ToWorker)        watcher event → IndexHost.notify
  ```

- **Boundary Contract:** section 6, `ToWorker` and `FromWorker`
- **Detailed Design:** section 7, `src/workspace/index-worker.ts`, `src/app/index-host.ts`
- **Must Not Own:**
  - Index state (owned by `update`), file writes, or UI.

## State reducers for DI2

- **Target:** `src/core/state/{index,link-edits,picker,whichkey,completion,side-panel,jumps,recent,session,config,keymap}.ts`
- **Kind:** pure reducer modules
- **Responsibilities:** each owns one AppState field or overlay variant and its action handlers, called from `createUpdate`.
- **Collaborators:**

  ```text
  createUpdate switch → onIndexBatch / onSearchResults / onEditsApplied / onConfigLoaded / onStateLoaded / onPreviewLoaded
  handleKeyAction → whichKeyKey / pickerKey / completionKey / sidePanelKey → runCommand
  ```

- **Boundary Contract:** section 6, `AppState` additions
- **Detailed Design:** section 7, per file
- **Must Not Own:**
  - I/O, clocks (time arrives in actions), or OpenTUI.

## Configuration adapters

- **Target:** `src/core/config/{schema,toml}.ts`, `src/workspace/{config-file,state-file,log}.ts`
- **Kind:** pure parser plus file adapters
- **Responsibilities:**
  - Resolve the XDG config and state paths, read the config text, and parse and validate it with lines.
  - Read and write the state file atomically.
  - Append the debug log.
- **Collaborators:**

  ```text
  configPath(env) → readConfigText → parseConfig(text) → ConfigResult → configLoaded
  statePath(env, realRoot) → readStateFile / saveStateFile(PersistedState)      createLogger(env) → Logger
  ```

- **Boundary Contract:** section 6, `AppConfig`, `ConfigResult`, `PersistedState`
- **Detailed Design:** section 7, per file
- **Must Not Own:**
  - Applying config to state (`state/config.ts`).

## Discovery and link UI

- **Target:** `src/ui/overlays/{whichkey,picker,completion}.ts`, `src/ui/views/side-panel.ts`, `src/ui/views/statusline.ts`
- **Kind:** OpenTUI views
- **Responsibilities:** paint the which-key grid, picker rows and preview, completion popup, side panel, and new statusline segments from state. Keys still flow through `update`.
- **Collaborators:**

  ```text
  OverlayHost.update(s) → WhichKeyView / PickerView(paintPreview → layoutText + paintLine) / CompletionView
  Shell → SidePanelView.update(s)          Statusline → statusSegments(s)
  ```

- **Boundary Contract:** section 6, `Overlay`, `PickerState`, `SidePanelState`, `StatusSegments`
- **Detailed Design:** section 7, `src/ui/*`
- **Must Not Own:**
  - Ranking, search, keymap resolution, or file reads.

# 4. Project Structure Changes

**Proposed Structure — not an actual Git diff.**

**Legend:** `[A] Added` · `[M] Modified` · `[R] Renamed/Moved` · `[D] Deleted`

```text
so/
├── [M] package.json
│       Contains: exact pins for the Markdown packages and toml-eslint-parser; build compiles main and the worker
│       Symbols: dependencies, scripts.build
│       Decisions: DES2, DES4, DES7
├── [M] bun.lock
│       Contains: resolved versions for the added packages
│       Symbols: None — lockfile
│       Decisions: DES2, DES7
├── [M] knip.json
│       Contains: the worker as an entry file (loaded through new URL, not imported)
│       Symbols: entry
│       Decisions: DES4
├── .github/workflows/
│   └── [M] release.yml
│           Contains: both compile loops pass src/workspace/index-worker.ts after src/app/main.ts
│           Symbols: build job step
│           Decisions: DES4
├── .s1mple/docs/
│   └── [M] project.md
│           Contains: new pins, the worker entrypoint, SO_LOG, the state and config paths
│           Symbols: None — documentation
│           Decisions: DES4, DES7, DES8
├── scripts/
│   └── [M] bench-gate.ts
│           Contains: targets firstFrame 200, indexReady 3000, indexingKeystrokeP95 16 and their bench files
│           Symbols: TARGETS, BENCHES, runOnce
│           Decisions: DES10
├── src/
│   ├── app/
│   │   ├── [M] main.ts
│   │   │       Contains: config and state loading before the first frame; derived keymaps; link and discovery
│   │   │                 registrations; index host start after the first frame; logger
│   │   │       Symbols: registries, main
│   │   │       Decisions: DES4, DES7, DES8, DES9
│   │   ├── [M] effects.ts
│   │   │       Contains: search, applyEdits, readPreview, loadConfig, saveState effects
│   │   │       Symbols: RunnerDeps, createEffectRunner
│   │   │       Decisions: DES4, DES6, DES7, DES8, DES9
│   │   ├── [A] index-host.ts
│   │   │       Contains: worker spawn, message translation, restart-once, notify, search
│   │   │       Symbols: IndexHost, createIndexHost
│   │   │       Decisions: DES4
│   │   └── [M] lifecycle.ts
│   │           Contains: state saved on every shutdown path within the flush bound
│   │           Symbols: installLifecycle
│   │           Decisions: DES8
│   ├── core/
│   │   ├── config/
│   │   │   ├── [M] schema.ts
│   │   │   │       Contains: strict schema with leader, keys, filetypes keys
│   │   │   │       Symbols: ConfigSchema, AppConfig, defaults, KeyBindingsSchema
│   │   │   │       Decisions: DES7
│   │   │   └── [A] toml.ts
│   │   │           Contains: TOML parse with locations, zod validation, issue → line mapping
│   │   │           Symbols: parseConfig, ConfigResult, ConfigError, BindingSource
│   │   │           Decisions: DES7
│   │   ├── features/links/
│   │   │   ├── [A] summarize.ts           Symbols: NoteSummary, LinkRef, summarize            Decisions: DES3
│   │   │   ├── [A] note-index.ts          Symbols: NoteIndex, emptyIndex, applySummaries, removePaths,
│   │   │   │                                       movePaths, addFiles, backlinksOf, tagCounts   Decisions: DES3, DES5
│   │   │   ├── [A] resolve.ts             Symbols: LinkTarget, resolveLink, linkText          Decisions: DES3
│   │   │   ├── [A] rename.ts              Symbols: FileEdit, SpanEdit, PathMove, planRename, renameImpact   Decisions: DES3, DES6
│   │   │   ├── [A] mentions.ts            Symbols: MentionHit, linkMentionEdit                Decisions: DES3, DES6
│   │   │   ├── [A] link-at.ts             Symbols: linkAt                                     Decisions: DES3
│   │   │   └── [A] commands.ts            Symbols: linkCommands, linkBindings, linkGroups     Decisions: DES3, DES9
│   │   ├── kernel/
│   │   │   ├── commands/
│   │   │   │   ├── [M] keymap.ts          Contains: leader passed to splitKeys     Symbols: Keymap   Decisions: DES7
│   │   │   │   └── [M] defaults.ts        Contains: DI2 global bindings and groups Symbols: defaultBindings, defaultGroups, Binding   Decisions: DES7, DES8, DES9
│   │   │   ├── text/
│   │   │   │   └── [A] fuzzy.ts           Symbols: fuzzyScore, FuzzyMatch, rankBy     Decisions: DES3
│   │   │   └── vim/
│   │   │       ├── [M] keys.ts            Contains: leader parameter                Symbols: splitKeys, NAMED   Decisions: DES7
│   │   │       ├── [M] engine.ts          Contains: jumped effect for jump motions  Symbols: moveCursor, cmdlineKey, JUMP_MOTIONS   Decisions: DES8
│   │   │       └── [M] types.ts           Symbols: VimEffect                        Decisions: DES8
│   │   ├── lang/markdown/
│   │   │   ├── [A] blocks.ts              Symbols: BlockKind, BlockSpan, splitBlocks     Decisions: DES2
│   │   │   ├── [A] syntax.ts              Symbols: SyntaxExtension, syntaxExtensions     Decisions: DES2
│   │   │   ├── [A] scan.ts                Symbols: DocScan, BlockScan, scanBlock, scanFrontmatter, scanText   Decisions: DES2
│   │   │   ├── [A] doc.ts                 Symbols: Block, Doc, parseDoc                  Decisions: DES2
│   │   │   ├── [A] mdast.ts               Symbols: MdNode, blockNode                     Decisions: DES2
│   │   │   └── [M] file-type.ts           Contains: analyze = parseDoc                   Symbols: markdownFileType   Decisions: DES2
│   │   └── state/
│   │       ├── [M] types.ts               Symbols: AppState, BufferState, Action, Effect, Overlay, PromptState,
│   │       │                                       TimerId, IndexState, PickerState, SidePanelState, JumpList,
│   │       │                                       CompletionState, WhichKeyState, LinkRewrite, PersistedState   Decisions: DES1
│   │       ├── [M] update.ts              Symbols: Registries, createUpdate, onTimerAction   Decisions: DES1, DES7
│   │       ├── [M] init.ts                Symbols: initialState                    Decisions: DES1
│   │       ├── [M] keys.ts                Symbols: handleKeyAction, applyVimEffects, cmdlineCompletions   Decisions: DES7, DES8, DES9
│   │       ├── [M] commands.ts            Symbols: EX_ALIASES, executeEx, builtins (file.save)   Decisions: DES7, DES8, DES9
│   │       ├── [M] buffers.ts             Symbols: onFileLoaded, openPath, withAnalysis, applyBufferEdits   Decisions: DES2, DES5, DES6, DES8
│   │       ├── [M] save.ts                Symbols: onSaved, onTimer                 Decisions: DES5
│   │       ├── [M] disk.ts                Symbols: onFileChanged                    Decisions: DES5
│   │       ├── [M] explorer.ts            Symbols: startOp, promptKey, submit, onFsResult   Decisions: DES5, DES6
│   │       ├── [M] status.ts              Symbols: StatusSegments, statusSegments   Decisions: DES9
│   │       ├── [A] index.ts               Symbols: onIndexBatch, onIndexReady, onIndexFailed, summarizeSaved,
│   │       │                                       indexAfterFsOp, indexAfterFileEvent, nextSearchId   Decisions: DES5
│   │       ├── [A] link-edits.ts          Symbols: requireIndex, startRename, beginRewrite, onEditsApplied   Decisions: DES6
│   │       ├── [A] keymap.ts              Symbols: keymapFor, effectiveBindings     Decisions: DES7
│   │       ├── [A] config.ts              Symbols: onConfigLoaded, validateBindings Decisions: DES7
│   │       ├── [A] jumps.ts               Symbols: pushJump, jumpBack, jumpForward, jumpSegment   Decisions: DES8
│   │       ├── [A] recent.ts              Symbols: touchRecent                      Decisions: DES8
│   │       ├── [A] session.ts             Symbols: snapshotSession, onStateLoaded, sessionChanged, parsePersisted   Decisions: DES8
│   │       ├── [A] whichkey.ts            Symbols: armWhichKey, onWhichKeyTimer, whichKeyKey, whichKeyRows   Decisions: DES9
│   │       ├── [A] picker.ts              Symbols: PickerSource, pickerSources, openPicker, pickerKey,
│   │       │                                       onSearchResults, onPreviewLoaded, onSearchTimer   Decisions: DES9
│   │       ├── [A] completion.ts          Symbols: maybeOpenCompletion, completionKey   Decisions: DES9
│   │       └── [A] side-panel.ts          Symbols: toggleSidePanel, sidePanelKey, sidePanelRows   Decisions: DES9
│   ├── ui/
│   │   ├── [M] shell.ts                   Contains: new overlay views and side panel; per-key escTimeoutMs   Symbols: createShell   Decisions: DES7, DES9
│   │   ├── [M] theme.ts                   Contains: config.color "never" forces nocolor   Symbols: themeOf   Decisions: DES7
│   │   ├── editors/
│   │   │   └── [M] text-view.ts           Contains: analysis read from state; paintPreview   Symbols: EditorView, paintPreview   Decisions: DES2, DES9
│   │   ├── overlays/
│   │   │   ├── [A] whichkey.ts            Symbols: WhichKeyView                     Decisions: DES9
│   │   │   ├── [A] picker.ts              Symbols: PickerView                       Decisions: DES9
│   │   │   ├── [A] completion.ts          Symbols: CompletionView                   Decisions: DES9
│   │   │   └── [M] prompt.ts              Contains: impact and invalid lines        Symbols: PromptView   Decisions: DES6
│   │   └── views/
│   │       ├── [A] side-panel.ts          Symbols: SidePanelView                    Decisions: DES9
│   │       ├── [M] statusline.ts          Contains: backlinks, index, jump segments Symbols: Statusline   Decisions: DES9
│   │       └── [M] window-tree.ts         Contains: editor area narrowed by the docked side panel   Symbols: WindowTree   Decisions: DES9
│   └── workspace/
│       ├── [A] index-worker.ts            Symbols: ToWorker, FromWorker, SearchHit   Decisions: DES4
│       ├── [A] config-file.ts             Symbols: configPath, readConfigText       Decisions: DES7
│       ├── [A] state-file.ts              Symbols: statePath, readStateFile, saveStateFile   Decisions: DES8
│       └── [A] log.ts                     Symbols: Logger, createLogger             Decisions: DES7
└── test/
    ├── [M] boundaries.test.ts             Contains: per-package homes; worker rule  Symbols: PACKAGE_HOMES, checkImports   Decisions: DES2, DES4, DES7
    ├── [M] repo.test.ts                   Contains: every compile lists the worker  Decisions: DES4
    ├── fixtures/
    │   ├── [M] generate.ts                Symbols: makeNoteWorkspace (10,000 notes)  Decisions: DES10
    │   ├── [A] markdown-corpus/*.md       Contains: conformance corpus              Decisions: DES2
    │   └── [A] workspace/notes/{plan,…}.md Contains: link fixtures for UV4/UV5 (31 links in 12 files)   Decisions: DES9
    ├── support/
    │   ├── [M] state.ts                   Symbols: testRegistries                   Decisions: DES7
    │   └── [M] ui.ts                      Symbols: mountShell (index status, config) Decisions: DES9
    ├── vim/
    │   ├── [M] cases.ts                   Contains: jump motion + <C-o>/<C-i> cases Decisions: DES8
    │   └── [M] expected.json              Contains: recorded Neovim results        Decisions: DES8
    ├── ui/
    │   ├── [A] discovery.test.ts          Decisions: DES9
    │   ├── [A] links.test.ts              Decisions: DES9
    │   ├── [M] shell.golden.test.ts (+ __snapshots__)   Decisions: DES9
    │   └── [M] file-ops.test.ts           Decisions: DES6
    ├── integration/
    │   ├── [A] index-host.test.ts         Decisions: DES4, DES5
    │   ├── [A] rename.test.ts             Decisions: DES6
    │   ├── [A] config.test.ts             Decisions: DES7
    │   └── [A] session.test.ts            Decisions: DES8
    ├── e2e/
    │   └── [A] binary-index.test.ts       Decisions: DES4
    └── bench/
        ├── [A] startup.bench.ts           Decisions: DES10
        └── [A] indexing-keystroke.bench.ts   Decisions: DES10
```

Colocated unit tests (`*.test.ts` next to each added or modified `src` file) are listed in section 8 and follow the DI1 convention.

# 5. Runtime Flows and Error Policies

## Startup and indexing

**Participating Symbols:** `main`, `readConfigText`, `parseConfig`, `onConfigLoaded`, `readStateFile`, `parsePersisted`, `onStateLoaded`, `createIndexHost`, `onIndexBatch`, `onIndexReady`

**Illustrative Flow:**

```text
main → resolveWorkspace → registries() → createStore(initialState)
     → dispatch configLoaded(parseConfig(readConfigText(configPath(env))))   invalid → defaults + "config.toml:7: …" toast
     → dispatch stateLoaded(parsePersisted(readStateFile(statePath)), restore: ws.file === undefined)
     → shell.attach (first frame) → listDir("") [+ read(file) | reads of restored windows]
     → setImmediate: watchWorkspace; indexHost.start(root) ─► worker scan
           worker → batch{files, summaries, done, total}* → indexBatch → status indexing n/total
           worker → ready → indexReady → status ready, toast "index ready"
           crash → restart once (indexFailed final=false, rescan) → crash → indexFailed final=true → "index unavailable"
```

1. `main` reads `config.toml` and the state file synchronously. Both are small and must shape the first frame (theme, leader, layout).
2. `onConfigLoaded` validates bindings against the registries. On failure, defaults apply and one toast names the first error.
3. `onStateLoaded` sets `recent` and `jumps`. When `restore` is true and the layout is non-empty, it creates the window tree and emits one `read` per distinct path.
4. The first frame paints with `index.status = "idle"`; the statusline shows nothing for the index until the first batch.
5. After the first frame, `createIndexHost` starts the worker. Batches of up to 500 summaries arrive. Each `indexBatch` applies the summaries and files incrementally, so link features answer from the partial index.

**Detailed Control Flow:** section 7, `src/app/main.ts`, `src/app/index-host.ts`, `src/core/state/index.ts`

## Edit to analysis

**Participating Symbols:** `withAnalysis`, `parseDoc`, `splitBlocks`, `scanBlock`, `EditorView.rows`

**Illustrative Flow:**

```text
key → runVim → buffer.text (new version) → withAnalysis(b, ft) → parseDoc(text, prevDoc)
        → splitBlocks (line scan) → reuse blocks with equal hash → scanBlock for changed blocks → Doc{scan}
EditorView.rows → layoutText(view, providers, b.analysis)      (no analysis computed in the UI)
blockNode(block) → only when a consumer asks (DI3 rendering; tests in DI2)
```

1. Every place that replaces `BufferState.text` calls `withAnalysis`, which runs `ft.analyze(text, prev)` only when the file type has `analyze` and the version changed.
2. `parseDoc` hashes each block's text, and reuses the previous `Block` and `BlockScan` objects when the hash matches.

**Detailed Control Flow:** section 7, `src/core/lang/markdown/doc.ts`, `src/core/state/buffers.ts`

## Key routing and discovery

**Participating Symbols:** `handleKeyAction`, `keymapFor`, `armWhichKey`, `onWhichKeyTimer`, `whichKeyKey`, `pickerKey`, `completionKey`, `sidePanelKey`, `runCommand`, `executeEx`

**Illustrative Flow:**

```text
key → overlay conflict/prompt (DI1) | whichKey → whichKeyKey | picker/palette/help → pickerKey | completion → completionKey
    → side panel focused → sidePanelKey
    → ":" line → cmdlineKey (Tab: ex names, then commands.list(ft)); Enter → executeEx (alias | command id)
    → keymapFor(reg, config).lookup({mode, filetype}, pending+key)
        command → runCommand (filetypes check → "not available for <type> files")
        prefix  → pending, startTimer whichKey 300 ms ── timer(now) with same pending → overlay whichKey
        none    → vim engine
```

1. `armWhichKey` records `vim.pending` and emits `startTimer {id: "whichKey", ms: 300}`. When the timer fires and the pending sequence is unchanged and still a prefix, `onWhichKeyTimer` opens the overlay.
2. While the overlay is open, keys continue the sequence: `<BS>` drops one key, `<Esc>` cancels, and an unknown key closes the overlay with `no mapping for <seq>`.
3. `executeEx` now runs a registered command id typed on the `:` line (`:link.follow`) through `runCommand`, which applies the file-type check.

**Detailed Control Flow:** section 7, `src/core/state/keys.ts`, `src/core/state/whichkey.ts`, `src/core/state/commands.ts`

## Picker query, search, and preview

**Participating Symbols:** `openPicker`, `pickerSources`, `fuzzyScore`, `rankBy`, `pickerKey`, `onSearchTimer`, `onSearchResults`, `onPreviewLoaded`, `PickerView`, `paintPreview`

**Illustrative Flow:**

```text
<leader>ff → openPicker("files") → items = rankBy(index.ix.files ∪ open paths, query, fuzzyScore)
type → query → re-rank (files, recent, headings, tags, commands, help: synchronous)
          grep: startTimer search 100 ms → timer → effect search{id, query, limit: 1000} → worker
                → searchResults{id} (id ≠ picker.search.id → dropped) → rows, "1000+" when capped
selection change (cols ≥ 100, file-based item) → open buffer? preview from memory : effect readPreview{id, path}
          → previewLoaded{id} (stale id → dropped) → PickerView.paintPreview(source view, target line centred)
Enter → source.accept(item) → openPath / runCommand / jump → pushJump
```

**Detailed Control Flow:** section 7, `src/core/state/picker.ts`, `src/ui/overlays/picker.ts`

## Follow, complete, and inspect links

**Participating Symbols:** `linkAt`, `resolveLink`, `followLink`, `pushJump`, `maybeOpenCompletion`, `completionKey`, `toggleSidePanel`, `backlinksOf`

**Illustrative Flow:**

```text
gd / Enter (markdown scope) → link.follow → linkAt(analysis.scan, cursor) → resolveLink(ix, path, raw)
     resolved   → pushJump(current) → openPath(target) → cursor at heading/block (after fileLoaded) → pushJump(target)
     unresolved → prompt confirm "Create <path>? [y/N]" (op create) → y → explorerOp(create) → read → open
     no link    → nothing
Insert "[[" → maybeOpenCompletion → overlay completion{mode notes}; "#" → headings of target; "#^" → blocks
     Enter/Tab → insert "name]]" (one change in the Insert session)
<leader>lb → toggleSidePanel("backlinks") → linked = backlinksOf(ix, path); unlinked → search{mode: mentions}
     cols < 100 → picker "backlinks" instead of the panel
```

**Detailed Control Flow:** section 7, `src/core/features/links/{link-at,resolve,commands}.ts`, `src/core/state/{completion,side-panel}.ts`

## Rename or move with link rewrite

**Participating Symbols:** `requireIndex`, `startRename`, `renameImpact`, `planRename`, `explorerOp`, `onFsResult`, `beginRewrite`, `applyBufferEdits`, `applyEdits` (runner), `onEditsApplied`

**Illustrative Flow:**

```text
explorer r/m | <leader>lr (file.rename) | file.move
  → requireIndex: indexing|idle → message "index not ready — try again when indexing finishes" (no prompt)
                  unavailable   → prompt impact "links will not be updated (index unavailable)"
                  ready         → prompt; every value change → renameImpact(ix, moves, open) → "31 links in 12 files"
  → Enter → plan = planRename(ix, moves, open) → index.rewrite = {op, plan} → explorerOp(op) (flush writes, fs op)
  → fsResult ok=false → rewrite dropped, message reason (no link edits)
  → fsResult ok=true → repath buffers (DI1) → indexAfterFsOp → beginRewrite:
        open buffers: applyBufferEdits (one undo step, dirty, autosave scheduled)
        closed files: effect applyEdits{batch, edit} per file (serial queue)
  → runner: read current text → every span text === expected ? atomicWrite + ownOps.noteWrite : skip
        → editsApplied{batch, path, ok, text?, reason?}
  → onEditsApplied: summarize text into the index; when all reported → toast "12 files updated"
        (+ "skipped: a.md, b.md (changed on disk)" as an error toast when any skipped or failed)
```

**Detailed Control Flow:** section 7, `src/core/state/link-edits.ts`, `src/core/features/links/rename.ts`, `src/app/effects.ts`

## Link a mention

**Participating Symbols:** `sidePanelKey`, `linkMentionEdit`, `applyBufferEdits`, `applyEdits`, `onEditsApplied`

**Illustrative Flow:**

```text
side panel (or backlinks picker) "l" on an unlinked hit → link.linkMention → linkMentionEdit(ix, target, hit)
   hit.path open → applyBufferEdits (span re-validated against buffer text; stale → toast, no edit)
   closed → applyEdits{batch, edit} → runner validates → editsApplied → index updated → hit moves to Linked
```

**Detailed Control Flow:** section 7, `src/core/features/links/mentions.ts`, `src/core/state/side-panel.ts`

## Index freshness

**Participating Symbols:** `summarizeSaved`, `indexAfterFsOp`, `indexAfterFileEvent`, `IndexHost.notify`, `onIndexBatch`

**Illustrative Flow:**

```text
saved (own write, watcher silent) → buffer not dirty → summarize(path, stamp.mtimeMs, analysis.scan) → applySummaries
fsResult ok: create → addFiles (+ empty summary for a note); rename/move → movePaths; trash → removePaths
editsApplied ok → summarize from the written text's scan (scanDoc in core) → applySummaries
other program: fileChanged{changed, note} → IndexHost.notify → worker changed → batch → applySummaries
               fileChanged{changed, non-note file} → addFiles;   fileChanged{removed} → removePaths (and notify)
current note: outline, headings picker, link at cursor, own-heading completion → buffers[].analysis.scan
```

**Detailed Control Flow:** section 7, `src/core/state/index.ts`

## Jump navigation

**Participating Symbols:** `moveCursor` (engine), `VimEffect.jumped`, `applyVimEffects`, `pushJump`, `jumpBack`, `jumpForward`

**Illustrative Flow:**

```text
G / gg / n / N / * / # / % / { / } / search <CR> → engine: setCursor + effect jumped{from}
   → applyVimEffects → pushJump(jumps, {path, ...from})
link.follow / picker accept / :e / panel open → pushJump(current position) before leaving
<C-o> → jumpBack: at end → record current first; move at−1 → openPath or set cursor → "jump i/n"
<C-i>/<Tab> → jumpForward
```

**Detailed Control Flow:** section 7, `src/core/kernel/vim/engine.ts`, `src/core/state/jumps.ts`

## Session save and restore

**Participating Symbols:** `sessionChanged`, `snapshotSession`, `saveStateFile`, `installLifecycle`, `onStateLoaded`, `onFileLoaded`

**Illustrative Flow:**

```text
update(prev, a) → next: sessionChanged(prev, next) → startTimer saveState 2000 (restarts the debounce)
timer saveState → effect saveState{state: snapshotSession(next)} → runner → saveStateFile (atomic, 0600)
shutdown (signal, crash, :q exit) → saveStateFile(snapshotSession(store.get())) within FLUSH_BOUND_MS
start on folder → stateLoaded{restore: true} → windows.restore pending per window → read each path
   → fileLoaded → fill pending windows (cursor, scroll clamped) | fileRefused → count missing
   → last pending resolved → missing > 0 → toast "n files from the last session were not found"
```

**Detailed Control Flow:** section 7, `src/core/state/session.ts`, `src/workspace/state-file.ts`, `src/app/lifecycle.ts`

## Config load and reload

**Participating Symbols:** `configPath`, `readConfigText`, `parseConfig`, `onConfigLoaded`, `validateBindings`, `keymapFor`, `config.reload`

**Illustrative Flow:**

```text
startup: main → readConfigText(configPath(env)) → missing → no action; text → parseConfig → configLoaded{result, reload:false}
:ConfigReload → effect loadConfig → runner → readConfigText + parseConfig → configLoaded{result, reload:true}
onConfigLoaded: result.ok && validateBindings(reg, result) ok → state.config = config (keymap re-derived lazily)
                errors → startup: defaults; reload: keep current → error toast "config.toml:7: <message> (+2 more)"
```

**Detailed Control Flow:** section 7, `src/core/config/toml.ts`, `src/core/state/config.ts`

## Failure and Recovery Rules

- **Worker crash** — Detected by `createIndexHost` through the worker's `error` event, an unexpected `close`, or an `error` message. Represented as `indexFailed {final: false}` on the first crash and `{final: true}` on the second. The host restarts once with a fresh scan; after the second crash the status becomes `unavailable`, link features use the last index, and grep shows `search unavailable — index unavailable`.
- **Worker missing from a binary** — Detected only by the compiled-binary test (V47) before release. At runtime the same `error` event path applies, so a broken binary still edits.
- **Rename during indexing** — Detected by `requireIndex`. Represented as the message `index not ready — try again when indexing finishes`, and nothing changes.
- **File-system operation fails** — Detected by `onFsResult` with `ok: false`. `index.rewrite` is dropped and the DI1 reason message is shown; no link edit applies.
- **Stale or failed closed-file edit** — Detected by the runner's `applyEdits` (`expected` mismatch, read failure, or write failure). Represented as `editsApplied {ok: false, reason}`. The file is skipped unchanged, and the aggregated error toast lists the skipped paths. There is no revert.
- **Stale mention in an open buffer** — Detected by `applyBufferEdits` comparing the expected text. Represented as the toast `mention changed — not linked`, and no edit is made.
- **Invalid config** — Detected by `parseConfig` or `validateBindings`. Represented as `ConfigError {line, message}[]`. At startup defaults apply; on reload the current config is kept; one error toast is shown either way.
- **Corrupt or unknown state file** — Detected by `parsePersisted`. Represented as `undefined`, so the state loads as empty silently.
- **State save fails** — Detected by the runner `saveState` case. Represented as a `log` line only: state is a convenience, not user data, so no toast is shown.
- **Search after the index becomes unavailable** — `onSearchTimer` sees `unavailable` and sets the picker error row without emitting `search`.
- **Preview read refused** — `previewLoaded` carries `refused`, and the preview shows the DI1 refusal text.

## Construction and Wiring Flow

```text
src/app/main.ts → registries(): FileTypeRegistry(+markdown analyze), CommandRegistry(builtins + linkCommands + discovery),
                   bindings = [...defaultBindings, ...linkBindings], groups = {...defaultGroups, ...linkGroups}
                ├→ logger = createLogger(process.env)
                ├→ runner = createEffectRunner({…, index: indexHost, logger, configPath, statePath})
                ├→ store = createStore(initialState, createUpdate(reg), runner.run)
                ├→ store.dispatch(configLoaded) ; store.dispatch(stateLoaded)
                ├→ shell.attach(store) ; installLifecycle({store, shell, runner, saveSession})
                └→ setImmediate: watchWorkspace(… → dispatch fileChanged + indexHost.notify) ; indexHost.start(root)
```

- **Construction:** `src/app/main.ts` — `registries`, `main` — builds registries with derived-keymap inputs, the logger, the index host (constructed before the runner so the runner can call `search`, started after the first frame), the runner, and the store.
- **Registration:** `src/app/main.ts` — `linkCommands`, `linkBindings`, and `linkGroups` from `src/core/features/links/commands.ts`; discovery and jump commands from `src/core/state/commands.ts` `builtins`; `markdownFileType` with `analyze`. `src/ui/shell.ts` adds `WhichKeyView`, `PickerView`, and `CompletionView` to `OverlayHost`, and `SidePanelView` to the views.
- **Exports:** `src/core/state/types.ts` — new state types; `src/core/features/links/*`, `src/core/lang/markdown/*`, and `src/core/kernel/text/fuzzy.ts` — new pure APIs; `src/workspace/index-worker.ts` — `ToWorker`, `FromWorker` (types for the host).
- **Configuration:** `src/workspace/config-file.ts` — `configPath(env)` at startup and per reload; `src/workspace/state-file.ts` — `statePath(env, realRoot)` at startup; `SO_LOG` read once by `createLogger`. `package.json` `scripts.build`, `.github/workflows/release.yml`, and `knip.json` include the worker entrypoint.

# 6. Logical Contracts, Data Models, and State

| Item | Kind | Purpose | Used By |
|---|---|---|---|
| `AppState` DI2 fields | State Model | the DI2 list: `buffers[].analysis`, `index`, `jumps`, `recent`, `panels.side`, overlay variants | `update` owns; views read |
| `Action` / `Effect` additions | Contract | the one-way protocol for index, search, config, state, edits, and previews | reducers ↔ effect runner, index host |
| `Doc` / `DocScan` | Data Model | the parsed note: blocks plus scan facts | `parseDoc` → state, summarizer, links features, DI3 |
| `SyntaxExtension` | Contract | one Obsidian syntax for both parse levels | `scanBlock`, `blockNode` |
| `NoteSummary` / `NoteIndex` | Data Model | workspace link knowledge and file list | worker and `index.ts` produce; links features, pickers, and panel consume |
| `FileEdit` | Contract | validated span edits for rename and link-mention | `planRename`, `linkMentionEdit` → `applyBufferEdits`, `applyEdits` |
| `ToWorker` / `FromWorker` | Message | worker protocol | `IndexHost` ↔ `index-worker.ts` |
| `AppConfig` / `ConfigResult` | Schema | user options and bindings with source lines | `parseConfig` → `onConfigLoaded` → `keymapFor` |
| `PersistedState` | Schema | recents, jumps, open buffers, and layout on disk | `snapshotSession` → `saveStateFile`; `readStateFile` → `parsePersisted` |
| `PickerState` / `PickerSource` | State Model, Contract | one model for every list overlay | `picker.ts` → `PickerView` |
| `Binding` | Contract | a key binding with scope and override flag | `defaultBindings`, `linkBindings`, config → `keymapFor`, help |

## `AppState` DI2 fields — State Model

**Purpose:** Hold every DI2 fact as plain values that `update` owns, exactly the phase-file DI2 list (`…phase-1…md:190`).

**Includes:**

- `buffers[].analysis?: unknown` — the file type's analysis for the buffer's current text version (`Doc` for Markdown).
- `index: IndexState` — `status`, `done`, `total`, `ix: NoteIndex`, `searchSeq`, and the in-flight `rewrite?: LinkRewrite`.
- `jumps: JumpList` — `entries: JumpEntry[]` and `at`.
- `recent: string[]` — most recent first, at most 100.
- `panels.side: SidePanelState` — `kind: "backlinks" | "outline"`, `open`, `focused`, `cursor`, `mentions`.
- `overlay` variants `whichKey`, `picker`, `palette`, `help`, `completion`.
- Sub-fields inside DI1 top-level fields: `windows.restore?` (pending restore), `PromptState.impact?`, and `PromptState.invalid?`.

**Usage:**

```text
Action → createUpdate → per-field reducer → AppState → views (statusSegments, PickerView, SidePanelView)
```

**Rules:**

- **Compatibility:** Only additive changes; the final shape equals RM261003ABZP-DES2@R2 apart from the reported additive sub-fields.
- **Invariants:** `index.status` moves `idle → indexing → ready`, with `→ unavailable` after the second crash. `jumps.at ≤ entries.length ≤ 100`. `recent` has no duplicates. `analysis` always corresponds to `text.version`.
- **Ownership and Lifecycle:** Created by `initialState`. `jumps`, `recent`, and the layout persist through `saveState`. `index` is never persisted.

**Location:** `src/core/state/types.ts` — `src/core/state/types.ts:51-68`, `:105-108`, `:114-137`

**Detailed Shape:** section 7, `src/core/state/types.ts`

## `Action` / `Effect` additions — Contract

**Purpose:** Carry every new asynchronous result into the pure reducer, and every new I/O request out of it.

**Includes:**

- Actions from the phase list: `indexBatch`, `indexReady`, `searchResults`, `configLoaded`, `stateLoaded`.
- Additive actions: `indexFailed`, `editsApplied`, `previewLoaded`.
- Effects from the phase list: `search`, `saveState`.
- Additive effects: `loadConfig`, `applyEdits`, `readPreview`.
- `TimerId` additions: `whichKey`, `saveState`, `search`.

**Usage:**

```text
update → Effect → createEffectRunner.run → (worker | fs | state file) → Action → update
```

**Rules:**

- **Compatibility:** DI1 variants are unchanged. Every addition beyond the phase list is reported for parent synchronization.
- **Invariants:** Every fallible effect answers with exactly one action (`search` → `searchResults`, empty while the worker is unavailable; `applyEdits` → `editsApplied`; `readPreview` → `previewLoaded`; `loadConfig` → `configLoaded`). `saveState` answers with nothing, and its failure is logged.
- **Ownership and Lifecycle:** Defined in core and executed by `src/app`.

**Location:** `src/core/state/types.ts` — `src/core/state/types.ts:35-38`, `:139-168`

**Detailed Shape:** section 7, `src/core/state/types.ts`

## `Doc` / `DocScan` — Data Model

**Purpose:** Hold the parsed Markdown buffer: the cheap whole-document facts, and blocks whose mdast is parsed lazily.

**Includes:**

- `Doc { version, frontmatter?, blocks: Block[], scan: DocScan }`.
- `Block { id, kind, startLine, endLine, hash, scan: BlockScan }`.
- `DocScan { frontmatter, headings[], links[], tags[], blockIds[], excluded[] }`, with positions in UTF-16 columns. `excluded` lists code, math, and comment ranges, so mention search skips them.

**Usage:**

```text
parseDoc(TextBuffer, prev) → Doc → buffers[].analysis → linkAt, outline, completion, summarize, planRename(open)
scanDoc(text) (worker, editsApplied) → DocScan → summarize
blockNode(Block) → MdNode (DI3)
```

**Rules:**

- **Compatibility:** DI3 reads `blocks` and `blockNode` without changing them (G2).
- **Invariants:** Blocks cover the document without overlap, and a fence, frontmatter, `$$` block, or list is never split. `parseDoc(buf, prev)` equals `parseDoc(buf)` structurally. Scan positions are source positions.
- **Ownership and Lifecycle:** Recomputed per buffer version. Unchanged blocks are reused by hash, and the mdast cache is keyed by hash.

**Location:** `src/core/lang/markdown/doc.ts`, `src/core/lang/markdown/scan.ts` — None — proposed item

**Detailed Shape:** section 7, `src/core/lang/markdown/doc.ts`, `src/core/lang/markdown/scan.ts`

## `SyntaxExtension` — Contract

**Purpose:** Define one Obsidian syntax once, for both the scan and mdast levels (RM261003ABZP-REQ11@R3 registration point).

**Includes:**

- `name` — for example `"wikiLink"`.
- `scan?(text, at, out)` — records matches from the plain-text segment of a block.
- `transform?(tree)` — rewrites mdast text nodes into Obsidian nodes.

**Usage:**

```text
syntaxExtensions → scanText (scan level) and blockNode (mdast level)
```

**Rules:**

- **Compatibility:** Registration-only extension. DI3 adds no syntax; DI4 may append one.
- **Invariants:** A syntax that yields links, tags, or block ids in `scan` also yields the same nodes in `transform` (V7).
- **Ownership and Lifecycle:** Static registry built at module load.

**Location:** `src/core/lang/markdown/syntax.ts` — None — proposed item

**Detailed Shape:** section 7, `src/core/lang/markdown/syntax.ts`

## `NoteSummary` / `NoteIndex` — Data Model

**Purpose:** Hold workspace link knowledge for notes plus the list of every non-excluded file.

**Includes:**

- `NoteSummary` — the parent shape: `{path, mtime, title, aliases, tags, headings[{text, level, line}], blocks[{id, line}], links[{target, subpath?, alias?, line, col, kind}], frontmatter}`. DI2 adds `range` and `raw` to each link (the full link source text) for rename planning.
- `NoteIndex` — `{summaries, files, byBasename, byAlias, byTag, backlinks}`, all readonly maps.

**Usage:**

```text
worker summarize | index.ts summarizeSaved → applySummaries(ix) → resolveLink, backlinksOf, tagCounts, planRename
```

**Rules:**

- **Compatibility:** DI3 and DI4 read `summaries`, `files`, and `resolveLink` (G2, G3).
- **Invariants:** Derived maps change only for the paths in an update. Only `.md` files have summaries. `files` covers every non-excluded file, notes included.
- **Ownership and Lifecycle:** Built by worker batches, then updated by `index.ts`. Never persisted.

**Location:** `src/core/features/links/note-index.ts`, `src/core/features/links/summarize.ts` — None — proposed item

**Detailed Shape:** section 7, `src/core/features/links/note-index.ts`

## `FileEdit` — Contract

**Purpose:** Express link edits that are safe to apply late, because each span carries the text it expects to replace.

**Includes:**

- `FileEdit { path, edits: SpanEdit[] }`.
- `SpanEdit { range, expected, text }`.

**Usage:**

```text
planRename | linkMentionEdit → FileEdit → applyBufferEdits (open) | effect applyEdits (closed)
```

**Rules:**

- **Compatibility:** None — new contract.
- **Invariants:** Spans within one file do not overlap and are applied from last to first. A file is edited only if every span's current text equals `expected`.
- **Ownership and Lifecycle:** Lives in `index.rewrite` until the batch reports back.

**Location:** `src/core/features/links/rename.ts` — None — proposed item

**Detailed Shape:** section 7, `src/core/features/links/rename.ts`

## `ToWorker` / `FromWorker` — Message

**Purpose:** The worker protocol (`…phase-1…md:259-267`), with optional additive fields.

**Includes:**

- `scan`, `changed`, `removed`, `search` (with optional `mode`, `names`, `exclude`).
- `batch` (with optional `files`), `ready`, `results` (with optional `capped`), `error`.

**Usage:**

```text
IndexHost → ToWorker → worker; worker → FromWorker → IndexHost → Action
```

**Rules:**

- **Compatibility:** The meaning of every phase-file message is unchanged (downstream boundary).
- **Invariants:** The worker never writes, and `results` carries the request id.
- **Ownership and Lifecycle:** One worker per process, with at most one restart.

**Location:** `src/workspace/index-worker.ts` — None — proposed item

**Detailed Shape:** section 7, `src/workspace/index-worker.ts`

## `AppConfig` / `ConfigResult` — Schema

**Purpose:** User options and keymap overrides, with the source line of every error and binding.

**Includes:**

- `leader`, `escTimeoutMs`, `autosave`, `theme`, `color`.
- `keys: Record<Mode, Record<seq, id>>`.
- `filetypes: Record<id, {keys}>`.
- `ConfigResult = {ok: true, config, sources: BindingSource[]} | {ok: false, errors: ConfigError[]}`.

**Usage:**

```text
parseConfig → configLoaded → onConfigLoaded(validateBindings) → state.config → keymapFor / themeOf / shell normalizer
```

**Rules:**

- **Compatibility:** Unknown keys, including `editor.*`, `preview.*`, and `daily.*`, are errors in DI2.
- **Invariants:** The file applies whole or not at all.
- **Ownership and Lifecycle:** Read at startup and on `:ConfigReload`.

**Location:** `src/core/config/schema.ts` — `src/core/config/schema.ts:3-17`

**Detailed Shape:** section 7, `src/core/config/schema.ts`, `src/core/config/toml.ts`

## `PersistedState` — Schema

**Purpose:** The per-workspace state file.

**Includes:**

- `version: 1`, `recent`, `jumps`, `buffers[{path, view}]`.
- `layout {tree, active, windows[{id, path, cursor, scroll}]}`.

**Usage:**

```text
snapshotSession(AppState) → saveStateFile ; readStateFile → parsePersisted → stateLoaded
```

**Rules:**

- **Compatibility:** Any version other than 1 loads as empty.
- **Invariants:** It holds no note text, and is stored outside the workspace with mode `0600`.
- **Ownership and Lifecycle:** Written 2 s after a session change and on shutdown.

**Location:** `src/core/state/session.ts` — None — proposed item

**Detailed Shape:** section 7, `src/core/state/session.ts`

## `PickerState` / `PickerSource` — State Model, Contract

**Purpose:** One model for files, recent, grep, headings, tags, tag notes, backlinks, commands (palette), and help.

**Includes:**

- `PickerState { source, query, items, total, selected, search?, preview?, error? }`.
- `PickerSource { id, title, items(s, reg, query), accept(s, item, now, reg), previewPath?(item) }`.

**Usage:**

```text
openPicker(id) → PickerState in overlay → pickerKey → source.items / accept → PickerView paints
```

**Rules:**

- **Compatibility:** Realizes the UI design's `PickerSource` contract (`rm261003abzp-ui-design.md:1404-1416`) with pure items and accept. Row rendering stays in the UI.
- **Invariants:** `items` is ranked. `selected < items.length` (or 0 when empty). A search or preview result applies only when its id matches.
- **Ownership and Lifecycle:** Exists while the overlay is open.

**Location:** `src/core/state/picker.ts` — None — proposed item

**Detailed Shape:** section 7, `src/core/state/picker.ts`

## `Binding` — Contract

**Purpose:** A key binding with its scope, used for the trie, which-key, help, and override markers.

**Includes:**

- `scope: KeyScope`, `seq`, `id`.
- `overridden?: true` for bindings from config.

**Usage:**

```text
defaultBindings + linkBindings + config → effectiveBindings → Keymap; help rows
```

**Rules:**

- **Compatibility:** `KeyScope` is unchanged (`src/core/kernel/commands/keymap.ts:6-7`).
- **Invariants:** A config binding replaces a default with the same scope and sequence.
- **Ownership and Lifecycle:** Derived per config object and memoized.

**Location:** `src/core/kernel/commands/defaults.ts` — `src/core/kernel/commands/defaults.ts:7-29`

**Detailed Shape:** section 7, `src/core/kernel/commands/defaults.ts`, `src/core/state/keymap.ts`

# 7. Detailed Code Design

## `src/core/state/types.ts`

- **Change:** Modify
- **Decisions:** DES1
- **Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ5@R1, W261003FX70-REQ6@R1, W261003FX70-REQ8@R1, W261003FX70-REQ9@R1
- **Responsibilities:** the AppState shape and the Action and Effect unions.
- **Affected Callers/Consumers:** every reducer in `src/core/state/`, `src/app/effects.ts` `run`, `src/ui/*` views, `test/support/{state,ui}.ts`
- **Construction/Wiring:** None — types only
- **Dependencies:** `NoteIndex`, `NoteSummary`, `FileEdit` (features/links); `SearchHit` (re-declared here as a core type; the worker imports it)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `TimerId` | `src/core/state/types.ts:35-38` — autosave, retry, toast | adds `"whichKey" \| "saveState" \| "search"` | `update.ts` `onTimerAction`, `effects.ts` timers |
| `BufferState` | `:51-68` | adds `analysis?: unknown` | `buffers.ts` `withAnalysis`, `text-view.ts` |
| `PromptState` | `:98-103` | adds `impact?: string`, `invalid?: string` | `explorer.ts`, `link-edits.ts`, `prompt.ts` view |
| `Overlay` | `:105-108` — none, prompt, conflict | adds `whichKey`, `picker`, `palette`, `help`, `completion` | `keys.ts`, `OverlayHost` views |
| `AppState` | `:114-137` | adds `index`, `jumps`, `recent`, `panels.side`, `windows.restore?` | `init.ts`, reducers, views |
| `Action` | `:139-157` | adds `indexBatch`, `indexReady`, `indexFailed`, `searchResults`, `configLoaded`, `stateLoaded`, `editsApplied`, `previewLoaded` | `update.ts`, `effects.ts`, `index-host.ts`, `main.ts` |
| `Effect` | `:159-168` | adds `search`, `saveState`, `loadConfig`, `applyEdits`, `readPreview` | `effects.ts` `run` |
| `SearchHit`, `IndexState`, `LinkRewrite`, `JumpEntry`, `JumpList`, `SidePanelState`, `PickerState`, `PickerItem`, `CompletionState`, `WhichKeyState`, `PersistedState` | None — new symbol | new types | reducers and views |

**Existing Shape:** `src/core/state/types.ts:105-108`, `:139-168`

```ts
export type Overlay =
  | { kind: "none" }
  | { kind: "prompt"; prompt: PromptState }
  | { kind: "conflict"; bufferId: BufferId; disk: TextFile; showDiff: boolean };

export type Action =
  | { type: "key"; key: Key; now: number }
  | { type: "fileLoaded"; path: string; file: TextFile }
  // … saved, saveFailed, fileChanged, dirListed, fsResult, trashAvailable, timer, clipboardText, mouse
export type Effect =
  | { kind: "read"; path: string }
  | { kind: "write"; path: string; text: string; expected?: Stamp }
  // … create/rename/move/trash, listDir, startTimer, cancelTimer, clipboardWrite, clipboardRead, exit
```

DI1 defines three overlays and the unions that carry file, timer, and clipboard results. Every fallible effect already answers with exactly one action, and DI2 keeps that rule for each new effect.

**Proposed Shape:**

```ts
export type TimerId =
  | `autosave:${BufferId}` | `retry:${BufferId}` | `toast:${number}`
  | "whichKey" | "saveState" | "search";

export type SearchHit = { path: string; line: number; col: number; len: number; text: string };

export type IndexState = {
  status: "idle" | "indexing" | "ready" | "unavailable";
  done: number;
  total: number;
  ix: NoteIndex;
  /** Next id for `search` effects; results with an older id are dropped. */
  searchSeq: number;
  /** A rename or link-mention waiting for its file operation or its closed-file writes. */
  rewrite?: LinkRewrite;
};
export type LinkRewrite = {
  batch: number;
  /** Rename and move: the file operation the edits wait for. */
  op?: FsOp;
  edits: FileEdit[];
  pending: string[];
  updated: string[];
  skipped: { path: string; reason: string }[];
};

export type JumpEntry = { path: string; line: number; col: number };
export type JumpList = { entries: JumpEntry[]; at: number };

export type SidePanelState = {
  kind: "backlinks" | "outline";
  open: boolean;
  focused: boolean;
  cursor: number;
  mentions?: { id: number; pending: boolean; hits: SearchHit[] };
};

export type PickerItem = { key: string; label: string; detail?: string; path?: string; line?: number; matches: number[] };
export type PickerState = {
  source: string;               // "files" | "recent" | "grep" | "headings" | "tags" | "tagNotes" | "backlinks" | "commands" | "help"
  arg?: string;                 // tagNotes: the tag; backlinks: the target path
  query: string;
  items: PickerItem[];
  total: number;
  selected: number;
  search?: { id: number; pending: boolean; capped: boolean };
  preview?: { id: number; path: string; line: number; file?: TextFile; refused?: "binary" | "tooLarge" | "io" };
  error?: string;
};
export type CompletionState = {
  anchor: Pos;                  // position just after "[["
  mode: "notes" | "headings" | "blocks";
  target?: string;              // resolved path for headings/blocks
  query: string;
  items: { insert: string; label: string; detail?: string }[];
  selected: number;
};
export type WhichKeyState = { prefix: Key[]; scope: KeyScope };

export type Overlay =
  | { kind: "none" }
  | { kind: "prompt"; prompt: PromptState }
  | { kind: "conflict"; bufferId: BufferId; disk: TextFile; showDiff: boolean }
  | { kind: "whichKey"; whichKey: WhichKeyState }
  | { kind: "picker" | "palette" | "help"; picker: PickerState }
  | { kind: "completion"; completion: CompletionState };

export type AppState = {
  // … DI1 fields unchanged …
  windows: { tree: WindowTree; byId: Record<WindowId, WindowState>; active: WindowId; nextWindowId: WindowId;
             restore?: { pending: Record<WindowId, { path: string; cursor: Pos; scroll: number }>; missing: number } };
  panels: { explorer: ExplorerState; side: SidePanelState };
  index: IndexState;
  jumps: JumpList;
  recent: string[];
};

export type Action = /* DI1 variants */
  | { type: "indexBatch"; summaries: NoteSummary[]; files: string[]; done: number; total: number }
  | { type: "indexReady" }
  | { type: "indexFailed"; final: boolean; reason: string }
  | { type: "searchResults"; id: number; hits: SearchHit[]; capped: boolean }
  | { type: "configLoaded"; result: ConfigResult; reload: boolean }
  | { type: "stateLoaded"; state: PersistedState | undefined; restore: boolean }
  | { type: "editsApplied"; batch: number; path: string; ok: boolean; text?: string; stamp?: Stamp; reason?: string }
  | { type: "previewLoaded"; id: number; path: string; result: TextFile | { refused: "binary" | "tooLarge" | "io" } };

export type Effect = /* DI1 variants */
  | { kind: "search"; id: number; query: string; limit: number; mode?: "text" | "mentions"; names?: string[]; exclude?: string }
  | { kind: "saveState"; state: PersistedState }
  | { kind: "loadConfig" }
  | { kind: "applyEdits"; batch: number; edit: FileEdit }
  | { kind: "readPreview"; id: number; path: string };
```

The new fields fall into four groups:

- **Index.** `IndexState` holds the index and its status, so `index.ix` is the only NoteIndex in the process. `searchSeq` gives each `search` effect a fresh id, and the picker and the side panel remember the id they wait for. `LinkRewrite` tracks one rename or link-mention: the file operation it waits for, the edits, and the per-file results aggregated into a single toast.
- **Overlays.** `palette` and `help` reuse `PickerState`, because they are picker sources with their own overlay kind; the statusline and help title use that kind.
- **Window restore.** `windows.restore` sits inside the DI1 `windows` field. It holds the pending restore per window until each file loads.
- **Results and requests.** The new actions carry worker, config, state, edit, and preview results. The new effects are their requests.

- **Invariants:**
  - Every new Effect except `saveState` answers with exactly one Action.
  - `index.rewrite` exists only between a submitted rename or mention and its last `editsApplied` (or a failed file operation).
  - No field for DI3 or DI4 is added.
- **Verification Coverage:** S1 — V52 (type check), V24, V25, V29

## `src/core/state/update.ts`

- **Change:** Modify
- **Decisions:** DES1, DES7, DES8
- **Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ7@R1, W261003FX70-REQ8@R1
- **Responsibilities:** the registries type and the pure reducer switch.
- **Affected Callers/Consumers:** `src/app/main.ts` `registries`, `test/support/state.ts` `testRegistries`, every `reg.keymap` reader (`src/core/state/keys.ts:39`)
- **Construction/Wiring:** `createUpdate(reg)` in `main.ts:175`
- **Dependencies:** reducers in `index.ts`, `link-edits.ts`, `config.ts`, `session.ts`, `picker.ts`, `whichkey.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `Registries` | `src/core/state/update.ts:21-26` — `{fileTypes, editorKinds, commands, keymap}` | `{fileTypes, editorKinds, commands, bindings: readonly Binding[], groups: Readonly<Record<string, string>>}` | `main.ts` `registries`, `testRegistries`, `keys.ts`, help and which-key |
| `createUpdate` | `:29-66` — switch over DI1 actions; `timer` → `save.onTimer` | adds the DI2 cases; `timer` → `onTimerAction`; after each handled action, `sessionChanged` may append `startTimer saveState` | all dispatchers |
| `onTimerAction` | None — new symbol | routes `whichKey`, `saveState`, `search`, else `save.onTimer` | `createUpdate` |

**Existing Shape:** `src/core/state/update.ts:21-34`

```ts
export type Registries = {
  fileTypes: FileTypeRegistry;
  editorKinds: EditorKindRegistry;
  commands: CommandRegistry<CommandContext, CommandResult>;
  keymap: Keymap;
};
export function createUpdate(reg: Registries): Update {
  return (state, action) => {
    try {
      switch (action.type) {
        case "key":
          return handleKeyAction(state, action, reg);
```

DI1 injects one immutable `Keymap` built at startup, so changing the config cannot change bindings. The switch is exhaustive, with a `never` check.

**Proposed Shape:**

```ts
export type Registries = {
  fileTypes: FileTypeRegistry;
  editorKinds: EditorKindRegistry;
  commands: CommandRegistry<CommandContext, CommandResult>;
  /** Built-in and registered bindings; config overrides are merged per config by `keymapFor`. */
  bindings: readonly Binding[];
  /** Which-key group labels by prefix sequence ("<leader>f" → "find"). */
  groups: Readonly<Record<string, string>>;
};

export function createUpdate(reg: Registries): Update {
  const step = (s: AppState, a: Action): Result => {
    switch (a.type) {
      // … DI1 cases unchanged except "timer" …
      case "timer": return onTimerAction(s, a, reg);
      case "indexBatch": return onIndexBatch(s, a);
      case "indexReady": return onIndexReady(s);
      case "indexFailed": return onIndexFailed(s, a);
      case "searchResults": return onSearchResults(s, a);
      case "configLoaded": return onConfigLoaded(s, a, reg);
      case "stateLoaded": return onStateLoaded(s, a);
      case "editsApplied": return onEditsApplied(s, a);
      case "previewLoaded": return onPreviewLoaded(s, a);
    }
  };
  return (state, action) => {
    try {
      const r = step(state, action);
      return sessionChanged(state, r.state)
        ? { state: r.state, effects: [...r.effects, { kind: "startTimer", id: "saveState", ms: 2000 }] }
        : r;
    } catch (e) {
      return { state: notifyError(state, e), effects: [] };
    }
  };
}
```

`Registries` now carries binding data instead of a built trie. `keymapFor(reg, state.config)` derives the trie and memoizes it per config object, so `:ConfigReload` only replaces `state.config`.

The session debounce lives in one place. `sessionChanged` compares the persisted parts of the previous and next state (recent, jumps, window tree, and the files shown). A restarted `startTimer` with the same id is the debounce, because the runner clears the previous timer (`src/app/effects.ts:87-88`).

- **Invariants:**
  - The switch stays exhaustive with a `never` check.
  - `update` stays pure; the only time source is the `now` carried by actions.
- **Verification Coverage:** S13 — V20, V39; S16 — V28

## `src/core/lang/markdown/blocks.ts`

- **Change:** Add
- **Decisions:** DES2
- **Requirements:** W261003FX70-REQ3@R1
- **Responsibilities:** split a buffer into blocks and classify them.
- **Affected Callers/Consumers:** `doc.ts` `parseDoc`, `scan.ts` `scanDoc`
- **Construction/Wiring:** None — pure function
- **Dependencies:** `TextBuffer` (kernel)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `BlockKind`, `BlockSpan`, `splitBlocks` | None — new symbol | as below | `doc.ts`, `scan.ts` |

**Existing Shape:** None — new file or symbol

```ts
None
```

There is no block model yet. DI1's `markdownFileType` has only a source view and a highlighter (`src/core/lang/markdown/file-type.ts:5-11`).

**Proposed Shape:**

```ts
export type BlockKind = "frontmatter" | "fence" | "math" | "indentedCode" | "heading" | "list" | "html" | "comment" | "paragraph";
export type BlockSpan = { kind: BlockKind; startLine: number; endLine: number };

/**
 * Blank-line-bounded blocks in one pass. Frontmatter (first line `---`), fences (``` or ~~~ with matching
 * close), `$$` math, `%%` comments, and lists are kept whole; an unclosed fence runs to the end.
 */
export function splitBlocks(lines: { line(i: number): string; lineCount: number }): BlockSpan[];
```

`splitBlocks` reads lines through the minimal `TextBuffer`-compatible interface, so the worker can pass an array-backed view of a file's text without building a buffer. Its single linear pass is the cost bound of the whole scan level.

- **Invariants:** Spans cover lines `0 … lineCount − 1` without overlap. The kinds `frontmatter`, `fence`, `math`, `comment`, and `list` are never split.
- **Verification Coverage:** S2 — V1

## `src/core/lang/markdown/syntax.ts`

- **Change:** Add
- **Decisions:** DES2
- **Requirements:** W261003FX70-REQ3@R1
- **Responsibilities:** the `syntaxExtensions` registry: one definition per Obsidian syntax for both levels.
- **Affected Callers/Consumers:** `scan.ts` `scanText`, `mdast.ts` `blockNode`
- **Construction/Wiring:** module-level array
- **Dependencies:** None (the mdast transform receives a tree typed structurally)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `SyntaxExtension`, `syntaxExtensions` | None — new symbol | as below | `scan.ts`, `mdast.ts` |

**Existing Shape:** None — new file or symbol

```ts
None
```

DI1 has no syntax registry.

**Proposed Shape:**

```ts
export type ScanOut = {
  links: LinkSpan[];          // wiki, embed, md
  tags: TagSpan[];
  blockIds: { id: string; line: number }[];
  excluded: Range[];          // inline code, inline math, %%…%% comments, <!-- --> inside the block
};
export type SyntaxExtension = {
  name: "wikiLink" | "embed" | "tag" | "highlight" | "comment" | "callout" | "blockId" | "footnote" | "math" | (string & {});
  /** Record matches in `text` (one line of a non-code block) starting at source column `col0` of `line`. */
  scan?(text: string, line: number, col0: number, out: ScanOut): void;
  /** Rewrite mdast text nodes into Obsidian nodes for this syntax. */
  transform?(tree: MdNode): void;
};
export const syntaxExtensions: readonly SyntaxExtension[];
// order: comment, math (inline), code spans are excluded first; then embed (![[…]]), wikiLink, md link (.md and other files), tag, blockId;
// highlight, callout, footnote contribute transforms only.
```

Each extension owns its pattern. For example, `WIKILINK_RE` from the parent design (`rm261003abzp-design.md:570`) is used by `wikiLink.scan` and `wikiLink.transform`, so there is no second grammar to drift. Exclusions come first in the order, so later scanners skip excluded ranges. That ordering is how links inside inline code or `%%comments%%` are ignored at the scan level.

- **Invariants:**
  - Tags follow Obsidian rules: letters, digits, `_`, `-`, and `/`; not all digits; nested with `/`.
  - Block ids use Latin letters, digits, and dashes (RM261003ABZP-REQ4@R3).
- **Verification Coverage:** S2 — V2, V3; S4 — V7

## `src/core/lang/markdown/scan.ts`

- **Change:** Add
- **Decisions:** DES2
- **Requirements:** W261003FX70-REQ3@R1, W261003FX70-REQ5@R1, W261003FX70-REQ6@R1
- **Responsibilities:** the linear scan level for a whole document or one block.
- **Affected Callers/Consumers:** `doc.ts` `parseDoc`; `src/workspace/index-worker.ts`; `src/core/state/index.ts` (`editsApplied`); `features/links/summarize.ts`
- **Construction/Wiring:** None — pure functions
- **Dependencies:** `blocks.ts`, `syntax.ts`, `yaml` (frontmatter values only)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `BlockScan`, `DocScan`, `LinkSpan`, `scanBlock`, `scanFrontmatter`, `scanDoc`, `mergeScans` | None — new symbol | as below | as above |

**Existing Shape:** None — new file or symbol

```ts
None
```

There is no scan code yet.

**Proposed Shape:**

```ts
export type LinkSpan = {
  kind: "wiki" | "embed" | "md";
  target: string;               // decoded target without subpath (md links URL-decoded)
  subpath?: string;             // "#H1#H2" or "#^block"
  alias?: string;
  raw: string;                  // exact source text of the whole link
  range: Range;                 // source range of `raw`
  inFrontmatter?: true;
};
export type BlockScan = {
  headings: { text: string; level: number; line: number }[];
  links: LinkSpan[];
  tags: { tag: string; range: Range }[];
  blockIds: { id: string; line: number }[];
  excluded: Range[];            // fenced/indented code, $$ math, %% and <!-- --> comments, inline code and math
};
export type DocScan = BlockScan & { frontmatter?: { data: Record<string, unknown>; tags: string[]; aliases: string[] } };

export function scanBlock(lines: LineSource, span: BlockSpan): BlockScan;          // code/math/comment blocks → only `excluded`
export function scanFrontmatter(lines: LineSource, span: BlockSpan): DocScan["frontmatter"] & { links: LinkSpan[] };
export function mergeScans(blocks: readonly BlockScan[], fm?: ReturnType<typeof scanFrontmatter>): DocScan;
/** Whole-text scan for the worker and written files. */
export function scanDoc(text: string): DocScan;
```

Each function has one job:

- `scanBlock` runs the syntax scanners over each line of a prose block. Fenced, indented, `$$`, and comment blocks contribute only an `excluded` range.
- `scanFrontmatter` parses the YAML with `yaml` for `tags` and `aliases` (string or list). It also runs the `wikiLink` scanner over the raw frontmatter lines, so `related: "[[plan]]"` yields a link with an exact source range for rename (V6@R2 (a)).
- `mergeScans` concatenates block results in order, so `Doc.scan` is cheap to rebuild when one block changes.
- `scanDoc` is `splitBlocks` plus `scanBlock` over plain text, for callers without a `TextBuffer`.

- **Invariants:**
  - Linear in text length. No regex backtracking across lines.
  - Every `range` slices to `raw` exactly.
- **Verification Coverage:** S2 — V2, V3, V4; S5 — V49, V51

## `src/core/lang/markdown/doc.ts`

- **Change:** Add
- **Decisions:** DES2
- **Requirements:** W261003FX70-REQ3@R1
- **Responsibilities:** `parseDoc` with the block cache; the `Doc` type.
- **Affected Callers/Consumers:** `file-type.ts` (`analyze`), `src/core/state/buffers.ts` `withAnalysis`, link features reading `analysis.scan`, DI3 live preview
- **Construction/Wiring:** registered as `markdownFileType.analyze`
- **Dependencies:** `blocks.ts`, `scan.ts`, kernel `TextBuffer`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `Block`, `Doc`, `parseDoc` | None — new symbol | as below | as above |

**Existing Shape:** None — new file or symbol

```ts
None
```

The parent proposed shape is `parseDoc(buf: TextBuffer, prev?: Doc): Doc` with `Block { id, kind, startLine, endLine, hash, node }` (`rm261003abzp-design.md:578-584`).

**Proposed Shape:**

```ts
export type Block = { id: number; kind: BlockKind; startLine: number; endLine: number; hash: string; scan: BlockScan };
export type Doc = { version: number; frontmatter?: DocScan["frontmatter"]; blocks: Block[]; scan: DocScan };

/** Reuse every block of `prev` whose text hash is unchanged; scan only the others. */
export function parseDoc(buf: TextBuffer, prev?: Doc): Doc;
```

`parseDoc` calls `splitBlocks`, hashes each block's lines with a pure FNV-1a function (core may not import `bun`, so `Bun.hash` is unavailable), and reuses `prev` blocks by `hash`. Only changed blocks are scanned before `mergeScans` builds `Doc.scan`.

`Block.id` is a pure function of the document, so the cache stays transparent. It is the 32-bit FNV-1a value of the block's `hash`, made unique in document order: a block whose value is already taken uses the next free value. `parseDoc` assigns ids on every call over the full block list (O(blocks)), whether or not a block was reused. A reused block keeps its object, and therefore its id, unless probing moves it. As a result, inserting, deleting, or editing other blocks leaves a block's id unchanged, which gives DI3 folds a stable key, while editing the block itself gives it a new id. One edge case remains: when an identical copy of a block is inserted above it, the copy takes the original value and the original moves to the next one. The parent's numeric `id` type is kept.

The parent's `node` field becomes the lazy accessor `blockNode(block)` in `mdast.ts`. The `Block` object stays plain data while mdast is still available per block (G2).

- **Invariants:**
  - `parseDoc(buf, prev)` deep-equals `parseDoc(buf)`, ids included.
  - `Block.id` depends only on the document's block hashes in order. Edits outside a block never change its id; editing the block changes it.
- **Verification Coverage:** S3 — V5, V6, V6a; S5 — V51

## `src/core/lang/markdown/mdast.ts`

- **Change:** Add
- **Decisions:** DES2
- **Requirements:** W261003FX70-REQ3@R1, W261003FX70-REQ2@R1
- **Responsibilities:** parse one block to mdast with GFM, math, and the Obsidian transforms, lazily, cached by hash.
- **Affected Callers/Consumers:** the conformance test in DI2; DI3 live preview and `renderHtml`
- **Construction/Wiring:** None — pure function with a bounded module cache
- **Dependencies:** `mdast-util-from-markdown`, `micromark-extension-gfm`, `mdast-util-gfm`, `micromark-extension-math`, `mdast-util-math`; `syntax.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `MdNode`, `blockNode` | None — new symbol | as below | conformance test; DI3 |

**Existing Shape:** None — new file or symbol

```ts
None
```

No mdast code exists.

**Proposed Shape:**

```ts
export type MdNode = { type: string; children?: MdNode[]; value?: string; position?: unknown; [k: string]: unknown };

/** The block's mdast, parsed on first request; cached by `block.hash` (at most 2,048 entries, least recently used evicted). */
export function blockNode(doc: Doc, block: Block, text: (from: number, to: number) => string): MdNode;
```

`blockNode` slices the block's text, parses it with the five packages, and applies every `syntaxExtensions[].transform`. The cache is keyed by hash, so equal blocks across documents share a tree. The bounded LRU keeps memory flat when DI3 scrolls a long note.

- **Invariants:** The cache is transparent: a cached and an uncached call return structurally equal trees.
- **Verification Coverage:** S4 — V7

## `src/core/lang/markdown/file-type.ts`

- **Change:** Modify
- **Decisions:** DES2
- **Requirements:** W261003FX70-REQ3@R1, W261003FX70-REQ1@R1
- **Responsibilities:** the `markdown` file type.
- **Affected Callers/Consumers:** `src/app/main.ts` registration; `src/core/state/status.ts:3` (id); `test/support/state.ts`
- **Construction/Wiring:** `fileTypes.register(markdownFileType)` (`main.ts:81`)
- **Dependencies:** `doc.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `markdownFileType` | `src/core/lang/markdown/file-type.ts:5-11` — no `analyze` | `FileType<Doc>` with `analyze: parseDoc` | `buffers.ts` `withAnalysis` |

**Existing Shape:** `src/core/lang/markdown/file-type.ts:5-11`

```ts
export const markdownFileType: FileType = {
  id: "markdown",
  match: { extensions: [".md"] },
  editor: "text",
  views: [{ id: "source", decorations: [] }],
  highlighter: lowlightHighlighter("markdown"),
};
```

The DI1 file type is source-only: there is no analysis, and the UI calls `analyze` only when one exists (`src/ui/editors/text-view.ts:243-246`).

**Proposed Shape:**

```ts
export const markdownFileType: FileType<Doc> = {
  id: "markdown",
  match: { extensions: [".md"] },
  editor: "text",
  views: [{ id: "source", decorations: [] }],
  highlighter: lowlightHighlighter("markdown"),
  analyze: parseDoc,
};
```

Adding `analyze` makes every Markdown buffer carry a `Doc`. The Markdown key scope is not declared here: link bindings are registered by `features/links/commands.ts` with `filetype: "markdown"`, because the kernel keymap already supports scopes (`src/core/kernel/commands/keymap.ts:6-7`).

- **Invariants:** Views are unchanged; DI3 appends `live` and `reading`.
- **Verification Coverage:** S3 — V5; S5 — V51

## `src/core/state/buffers.ts`

- **Change:** Modify
- **Decisions:** DES2, DES5, DES6, DES8
- **Requirements:** W261003FX70-REQ3@R1, W261003FX70-REQ6@R1, W261003FX70-REQ8@R1
- **Responsibilities:** buffer creation and opening; analysis upkeep; in-memory link edits; recents and restore on load.
- **Affected Callers/Consumers:** `keys.ts` `runVim` (`src/core/state/keys.ts:151-153`), `commands.ts` `substitute` (`:164-171`), `disk.ts` reload, `onFileLoaded`, `link-edits.ts`
- **Construction/Wiring:** None
- **Dependencies:** `Registries.fileTypes`, `jumps.ts`, `recent.ts`, `session.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `onFileLoaded` | `src/core/state/buffers.ts:182-221` — creates a buffer and shows it in the active window | also sets `analysis`, `touchRecent`, fills `windows.restore` windows for the path instead of the active window, and positions the cursor for a pending link target | `update.ts` |
| `openPath` | `:167-179` — autosave the buffer left, then show or read | unchanged signature; callers now call `pushJump` first | `commands.ts`, picker accept, `link.follow` |
| `withAnalysis` | None — new symbol | `(b: BufferState, ft: FileType) => BufferState` — re-analyzes when `text.version` changed | every text replacement site |
| `applyBufferEdits` | None — new symbol | applies a `FileEdit` to an open buffer as one undo block, or returns `stale` | `link-edits.ts`, `side-panel.ts` |

**Existing Shape:** `src/core/state/buffers.ts:189-208`

```ts
  const ft = reg.fileTypes.forPath(a.path);
  const { body, finalNewline } = splitFile(a.file);
  const text = createTextBuffer(body);
  const id = s.nextBufferId;
  const b: BufferState = {
    id, path: a.path, fileType: ft.id, view: ft.views[0]?.id ?? "source", text,
    undo: new UndoHistory(), /* … */ save: { kind: "idle" },
  };
```

DI1 builds the buffer without analysis. Text replacements in `runVim`, `substitute`, and reload write `text` directly.

**Proposed Shape:**

```ts
export function withAnalysis(b: BufferState, ft: FileType): BufferState {
  if (ft.analyze === undefined) return b;
  const prev = b.analysis as { version: number } | undefined;
  return prev?.version === b.text.version ? b : { ...b, analysis: ft.analyze(b.text, b.analysis) };
}

export type BufferEditResult = { state: AppState; stale: boolean };
/** Apply `edit` to the open buffer at `edit.path` as one undo block; nothing changes when any span's text differs from `expected`. */
export function applyBufferEdits(s: AppState, edit: FileEdit, now: number, reg: Registries): BufferEditResult & { effects: Effect[] };
```

`withAnalysis` is called by `setBuffer` whenever the patch contains `text`. That one choke point covers `runVim`, `substitute`, reload, and link edits. `applyBufferEdits` reuses the `TextBuffer.apply` and `UndoHistory.push` pattern of `substitute` (`src/core/state/commands.ts:144-171`), then calls `scheduleAutosave`, so link edits reach disk through the normal save path.

- **Invariants:**
  - `analysis.version === text.version` for every buffer with an analyzing file type.
  - A stale edit changes nothing.
- **Verification Coverage:** S3 — V5; S8 — V24, V38; S16 — V28

## `src/ui/editors/text-view.ts`

- **Change:** Modify
- **Decisions:** DES2, DES9
- **Requirements:** W261003FX70-REQ3@R1, W261003FX70-REQ9@R1
- **Responsibilities:** paint windows; paint picker previews through the same layout.
- **Affected Callers/Consumers:** `WindowTree`, `PickerView`
- **Construction/Wiring:** `registerEditorView("text", …)` (`src/app/main.ts:147`)
- **Dependencies:** `layoutText`, `highlightMarks`, `paintLine`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `analyses` | `src/ui/editors/text-view.ts:93-94` — UI-side `WeakMap` cache | removed | — |
| `EditorView.rows` | `:224-260` — computes `ft.analyze(b.text)` when missing | passes `b.analysis` to `layoutText` | — |
| `paintPreview` | None — new symbol | paints a `TextFile` or open `TextBuffer` in source view centred on `line`, with a match mark | `PickerView` |

**Existing Shape:** `src/ui/editors/text-view.ts:240-246`

```ts
      const ft = this.deps.fileTypes.get(b.fileType);
      const spec = ft?.views.find((v) => v.id === b.view) ?? ft?.views[0];
      let analysis = analyses.get(b.text);
      if (analysis === undefined && ft?.analyze !== undefined) {
        analysis = ft.analyze(b.text);
        analyses.set(b.text, analysis);
      }
```

DI1 analyzes in the paint path without `prev`. With `parseDoc` registered, this would full-scan on every new version and duplicate the reducer's work.

**Proposed Shape:**

```ts
      const ft = this.deps.fileTypes.get(b.fileType);
      const spec = ft?.views.find((v) => v.id === b.view) ?? ft?.views[0];
      return layoutText(view, [highlightMarks(ft?.highlighter), ...(spec?.decorations ?? []),
                               searchMarks(s.vim.search), selectionMarks(selection)], b.analysis);

/** Paint `text` in `r` in the file type's source view, `line` at a third of the height, `mark` styled as a search match. */
export function paintPreview(buf: OptimizedBuffer, theme: Theme, r: Rect, p: {
  text: TextBuffer; fileType: FileType; line: number; mark?: { col: number; len: number }; view?: string;
}): void;
```

The editor view stops owning analysis. `paintPreview` shares `layoutText` and `paintLine` with `EditorView`, so previews look exactly like the source view. The optional `view` parameter lets DI3 pass `reading` for notes without a contract change (W261003FX70-REQ9@R1).

- **Invariants:** No `analyze` call in `src/ui` (V54).
- **Verification Coverage:** S5 — V51; S17 — V42; obsolete reference — V54

## `src/core/features/links/summarize.ts`

- **Change:** Add
- **Decisions:** DES3
- **Requirements:** W261003FX70-REQ5@R1, W261003FX70-REQ1@R1
- **Responsibilities:** `DocScan` → `NoteSummary`.
- **Affected Callers/Consumers:** worker; `src/core/state/index.ts`
- **Construction/Wiring:** None
- **Dependencies:** `scan.ts` types

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `NoteSummary`, `LinkRef`, `summarize` | None — new symbol | as below | worker, `index.ts` |

**Existing Shape:** None — new file or symbol

```ts
None
```

The parent shape is at `rm261003abzp-design.md:402-404`.

**Proposed Shape:**

```ts
export type LinkRef = {
  target: string; subpath?: string; alias?: string; line: number; col: number;
  kind: "wiki" | "md" | "embed"; raw: string; range: Range; inFrontmatter?: true;
};
export type NoteSummary = {
  path: string; mtime: number; title: string; aliases: string[]; tags: string[];
  headings: { text: string; level: number; line: number }[]; blocks: { id: string; line: number }[];
  links: LinkRef[]; frontmatter: Record<string, unknown>;
};
export function summarize(path: string, mtime: number, scan: DocScan): NoteSummary;
```

The summary keeps the parent fields and adds `raw` and `range` per link. These let `planRename` and the backlinks context work without file reads. `title` is the first H1, or the basename when there is none.

- **Invariants:** `summarize` is a pure function of its inputs.
- **Verification Coverage:** S6 — V10; S12 — V25

## `src/core/features/links/note-index.ts`

- **Change:** Add
- **Decisions:** DES3, DES5
- **Requirements:** W261003FX70-REQ5@R1, W261003FX70-REQ1@R1
- **Responsibilities:** the immutable NoteIndex and its incremental updates.
- **Affected Callers/Consumers:** `index.ts`, `resolve.ts`, `rename.ts`, pickers, side panel, completion, statusline
- **Construction/Wiring:** `emptyIndex()` in `initialState`
- **Dependencies:** `summarize.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `NoteIndex`, `emptyIndex`, `applySummaries`, `removePaths`, `movePaths`, `addFiles`, `backlinksOf`, `tagCounts`, `notesWithTag` | None — new symbol | as below | as above |

**Existing Shape:** None — new file or symbol

```ts
None
```

There is no index yet.

**Proposed Shape:**

```ts
export type NoteIndex = {
  readonly summaries: ReadonlyMap<string, NoteSummary>;
  readonly files: ReadonlySet<string>;
  readonly byBasename: ReadonlyMap<string, readonly string[]>;   // lowercased name ("plan" for plan.md; "photo.png") → paths
  readonly byAlias: ReadonlyMap<string, readonly string[]>;
  readonly byTag: ReadonlyMap<string, readonly string[]>;         // nested tags also index their parents
  readonly backlinks: ReadonlyMap<string, readonly { from: string; link: LinkRef }[]>;  // resolved target → sources
};
export function emptyIndex(): NoteIndex;
export function applySummaries(ix: NoteIndex, summaries: readonly NoteSummary[], files?: readonly string[]): NoteIndex;
export function removePaths(ix: NoteIndex, paths: readonly string[]): NoteIndex;
export function movePaths(ix: NoteIndex, moves: readonly PathMove[]): NoteIndex;
export function addFiles(ix: NoteIndex, paths: readonly string[]): NoteIndex;
export function backlinksOf(ix: NoteIndex, path: string): readonly { from: string; link: LinkRef }[];
export function tagCounts(ix: NoteIndex): { tag: string; count: number }[];
```

Each update copies only the maps it touches. It removes the changed paths' old contributions and adds their new ones. The `backlinks` map stores resolved targets, so a new or removed file can change how links resolve. For that case, `applySummaries`, `addFiles`, and `removePaths` re-resolve the links whose target basename matches an affected basename (via `byBasename`). This keeps each update proportional to the affected names, not to the workspace.

- **Invariants:**
  - Derived maps equal a full rebuild from `summaries` and `files` (property test V10).
  - Only `.md` paths have summaries.
- **Verification Coverage:** S6 — V10; S12 — V25

## `src/core/features/links/resolve.ts`

- **Change:** Add
- **Decisions:** DES3
- **Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ6@R1
- **Responsibilities:** the documented resolution order, and the shortest unique link text.
- **Affected Callers/Consumers:** `link.follow`, completion, `note-index.ts` (backlinks), `rename.ts`, `mentions.ts`
- **Construction/Wiring:** None
- **Dependencies:** `note-index.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `LinkTarget`, `resolveLink`, `linkText` | None — new symbol | as below | as above |

**Existing Shape:** None — new file or symbol

```ts
None
```

The parent shape is `resolveLink(ix, from, raw): LinkTarget | {unresolved}` with the documented order (`rm261003abzp-design.md:707-709`).

**Proposed Shape:**

```ts
export type LinkTarget = { path: string; heading?: string[]; block?: string };
/** order: exact root path (with/without .md) → alias → basename candidates ranked by same folder as `from`, shortest path, alphabetical. */
export function resolveLink(ix: NoteIndex, from: string, ref: { target: string; subpath?: string }): LinkTarget | { unresolved: string };
/** The shortest path suffix of `to` that resolves to `to` from `from` ("plan", then "projects/plan", …); `.md` dropped for notes. */
export function linkText(ix: NoteIndex, from: string, to: string): string;
```

`resolveLink` implements the parent order unchanged. `linkText` defines "shortest unique" through `resolveLink` itself, so a written link always resolves back to its intended target. That is the property the rename invariant relies on.

The phase file's `shortestUnique(ix, target)` (`…phase-1…md:283`) lacks `from`. Because the order ranks the same folder first, uniqueness depends on the source, so `linkMentionEdit` passes `hit.path`.

- **Invariants:** `resolveLink(ix, from, {target: linkText(ix, from, to)})` returns `to`.
- **Verification Coverage:** S6 — V8, V9

## `src/core/features/links/rename.ts`

- **Change:** Add
- **Decisions:** DES3, DES6
- **Requirements:** W261003FX70-REQ6@R1
- **Responsibilities:** plan link edits for a set of path moves under the resolution invariant.
- **Affected Callers/Consumers:** `src/core/state/link-edits.ts` (`startRename`, `renameImpact`, submit)
- **Construction/Wiring:** None
- **Dependencies:** `note-index.ts`, `resolve.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `PathMove`, `SpanEdit`, `FileEdit`, `planRename`, `renameImpact` | None — new symbol | as below | `link-edits.ts` |

**Existing Shape:** None — new file or symbol

```ts
None
```

The parent signature is `planRename(ix, from, to, read: (p) => string): FileEdit[]` (`rm261003abzp-design.md:710`).

**Proposed Shape:**

```ts
export type PathMove = { from: string; to: string };
export type SpanEdit = { range: Range; expected: string; text: string };
export type FileEdit = { path: string; edits: SpanEdit[] };

/**
 * Edits that keep every resolved link pointing at its file after `moves`. Link spans come from
 * `open` (live scans of open buffers, by current path) and from summaries for every other note.
 * Edit paths are post-move paths.
 */
export function planRename(ix: NoteIndex, moves: readonly PathMove[], open: ReadonlyMap<string, DocScan>): FileEdit[];
export function renameImpact(plan: readonly FileEdit[]): { links: number; files: number };
```

`planRename` works in five steps:

1. Build `after = movePaths(ix, moves)`.
2. Collect candidate links:
   - links whose resolved target is a moved path (`backlinks`);
   - every link in a moved note;
   - links whose target basename equals any moved file's new basename, since the new name may capture them.
3. For each candidate, compare `resolveLink(ix, source, ref)` with `resolveLink(after, movedSource, ref)`. A link whose target changed is rewritten to `linkText(after, movedSource, newTarget)`, keeping its kind, alias, and subpath.
4. Wiki and embed links keep the `[[…]]` or `![[…]]` form. Markdown links keep `[text](…)` with the destination URL-encoded as in the source.
5. Each `SpanEdit.expected` is the link's `raw` text.

Planning reads no files, which is why open buffers supply their live scans. `renameImpact` turns the plan into the `31 links in 12 files` line.

- **Invariants:**
  - For every link resolved before the moves, its target after applying the plan equals the moved image of its target before (property V12).
  - Only link spans change.
- **Verification Coverage:** S7 — V11, V12, V13, V14; S8 — V38

## `src/core/features/links/mentions.ts`

- **Change:** Add
- **Decisions:** DES3, DES6
- **Requirements:** W261003FX70-REQ6@R1
- **Responsibilities:** the `link.linkMention` span edit.
- **Affected Callers/Consumers:** `src/core/state/side-panel.ts`, the backlinks picker accept action
- **Construction/Wiring:** None
- **Dependencies:** `resolve.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `MentionHit`, `linkMentionEdit` | None — new symbol | as below | side panel |

**Existing Shape:** None — new file or symbol

```ts
None
```

The phase-file shape is `linkMentionEdit(ix, target, hit): FileEdit` (`…phase-1…md:281-286`).

**Proposed Shape:**

```ts
export type MentionHit = { path: string; range: Range; text: string };
export function linkMentionEdit(ix: NoteIndex, target: string, hit: MentionHit): FileEdit {
  const name = linkText(ix, hit.path, target);
  const link = hit.text === basenameNoExt(target) ? `[[${name}]]` : `[[${name}|${hit.text}]]`;
  return { path: hit.path, edits: [{ range: hit.range, expected: hit.text, text: link }] };
}
```

This matches the phase shape, with two refinements:

- `expected` makes the edit self-validating, which implements the phase invariant "re-validated against current text before editing".
- `linkText` is relative to the mention's note.

- **Invariants:** Only the mention span changes.
- **Verification Coverage:** S9 — V15, V38

## `src/core/features/links/link-at.ts`

- **Change:** Add
- **Decisions:** DES3
- **Requirements:** W261003FX70-REQ1@R1
- **Responsibilities:** the link under the cursor, from a scan.
- **Affected Callers/Consumers:** `link.follow`, completion (`#` and `#^` target), side panel
- **Construction/Wiring:** None
- **Dependencies:** `scan.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `linkAt` | None — new symbol | `(scan: DocScan, at: Pos) => LinkSpan \| undefined` | `commands.ts` |

**Existing Shape:** None — new file or symbol

```ts
None
```

There is no link-at-cursor code yet.

**Proposed Shape:**

```ts
/** The link whose source range contains `at` (end exclusive); links are sorted by position, so binary search. */
export function linkAt(scan: DocScan, at: Pos): LinkSpan | undefined;
```

Because `linkAt` reads the same scan the index uses, `gd` and the index cannot disagree about what is a link.

- **Invariants:** `linkAt` returns nothing inside code, math, or comments.
- **Verification Coverage:** S18 — V23

## `src/core/features/links/commands.ts`

- **Change:** Add
- **Decisions:** DES3, DES9
- **Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ6@R1
- **Responsibilities:** link commands, Markdown-scoped bindings, and the `l` (links) which-key group.
- **Affected Callers/Consumers:** `src/app/main.ts` `registries`, `test/support/state.ts`
- **Construction/Wiring:** `for (const c of linkCommands) commands.register(c)`; bindings and groups concatenated into `Registries`
- **Dependencies:** `src/core/state/*` reducers (commands are `Command<CommandContext, CommandResult>`)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `linkCommands`, `linkBindings`, `linkGroups` | None — new symbol | as below | `main.ts`, tests |

**Existing Shape:** None — new file or symbol

```ts
None
```

DI1 registers only built-ins (`src/core/state/commands.ts:354-358`).

**Proposed Shape:**

```ts
export const linkCommands: readonly AppCommand[] = [
  { id: "link.follow", title: "Follow link", filetypes: ["markdown"], run: followLink },
  { id: "link.backlinks", title: "Toggle backlinks panel", filetypes: ["markdown"], run: (c) => toggleSidePanel(c, "backlinks") },
  { id: "link.linkMention", title: "Link this mention", filetypes: ["markdown"], run: linkMentionAtPanel },
  { id: "view.outline", title: "Toggle outline", filetypes: ["markdown"], run: (c) => toggleSidePanel(c, "outline") },
  { id: "search.headings", title: "Headings in note", filetypes: ["markdown"], run: (c) => openPicker(c, "headings") },
  { id: "search.backlinks", title: "Backlinks", filetypes: ["markdown"], run: (c) => openPicker(c, "backlinks") },
  { id: "search.tags", title: "Tags", run: (c) => openPicker(c, "tags") },
  { id: "file.rename", title: "Rename (update links)", run: (c) => startRename(c, "rename") },
  { id: "file.move", title: "Move (update links)", run: (c) => startRename(c, "move") },
];
const md = (mode: Mode) => ({ mode, filetype: "markdown" }) as const;
export const linkBindings: readonly Binding[] = [
  { scope: md("normal"), seq: "gd", id: "link.follow" },
  { scope: md("normal"), seq: "<CR>", id: "link.follow" },
  { scope: md("normal"), seq: "<leader>lb", id: "link.backlinks" },
  { scope: md("normal"), seq: "<leader>lr", id: "file.rename" },
  { scope: md("normal"), seq: "<leader>o", id: "view.outline" },
  { scope: md("normal"), seq: "<leader>sh", id: "search.headings" },
  { scope: md("normal"), seq: "<leader>sb", id: "search.backlinks" },
];
export const linkGroups = { "<leader>l": "links" } as const;
```

Every note command carries `filetypes: ["markdown"]`, and every note binding uses the Markdown scope. In `sync.ts`, which-key therefore shows no `+links`, the palette and `:` completion hide `link.*` (`list(filetype)`), and `:link.follow` gets DI1's notice (`src/core/state/commands.ts:79-85`).

`file.rename` and `file.move` are global commands, because renaming any file keeps links. Only their `<leader>lr` binding is note-scoped, as UV4 requires: no `+links` group in `sync.ts`.

`search.tags` is global, as in the M3 command list.

- **Invariants:** No binding in `linkBindings` lacks `filetype: "markdown"` (V22).
- **Verification Coverage:** S15 — V22, V42

## `src/core/kernel/text/fuzzy.ts`

- **Change:** Add
- **Decisions:** DES3
- **Requirements:** W261003FX70-REQ9@R1
- **Responsibilities:** fzf v1 fuzzy scoring and ranking.
- **Affected Callers/Consumers:** `src/core/state/picker.ts`, `src/core/state/completion.ts`, `cmdlineCompletions` ordering
- **Construction/Wiring:** None
- **Dependencies:** None (kernel, no packages)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `FuzzyMatch`, `fuzzyScore`, `rankBy`, `SCORE` | None — new symbol | as below | pickers, completion |

**Existing Shape:** None — new file or symbol

```ts
None
```

There is no fuzzy matcher yet.

**Proposed Shape:**

```ts
export const SCORE = { match: 16, gapStart: -3, gapExtension: -1, boundary: 8, camel: 7, consecutive: 4, firstCharMultiplier: 2 } as const;
export type FuzzyMatch = { score: number; positions: number[] };
/** fzf v1: forward scan for the first match, backward scan for the shortest window, then scoring; null when `query` is not a subsequence. Smart-case: case-insensitive unless `query` has an uppercase letter. */
export function fuzzyScore(text: string, query: string): FuzzyMatch | null;
/** Matches sorted by score descending, then shorter text, then alphabetical. Empty query → input order. */
export function rankBy<T>(items: readonly T[], query: string, text: (t: T) => string): { item: T; match: FuzzyMatch }[];
```

The constants are fzf's published values. Boundary bonuses apply after `/`, `-`, `_`, `.`, and spaces, which is why `srd` prefers `so-roadmap` over `side-projects`. The function is language-neutral and package-free, so it belongs in the kernel next to the text model. The parent file lists it as `features/links/fuzzy.ts`, which is reported for parent synchronization.

- **Invariants:** The result is deterministic, and ties are broken exactly as documented.
- **Verification Coverage:** S17 — V16, V42

## `src/workspace/index-worker.ts`

- **Change:** Add
- **Decisions:** DES4
- **Requirements:** W261003FX70-REQ4@R1, W261003FX70-REQ5@R1, W261003FX70-REQ6@R1, W261003FX70-REQ9@R1
- **Responsibilities:** the worker thread: scan, summarize, and search. It never writes.
- **Affected Callers/Consumers:** `src/app/index-host.ts`
- **Construction/Wiring:** second compile entrypoint; loaded by `new Worker(new URL("../workspace/index-worker.ts", import.meta.url))`
- **Dependencies:** `src/workspace/{fs,ignore}.ts` (`readTextFile`, `createExclusionMatcher`), `src/core/lang/markdown/scan.ts`, `src/core/features/links/summarize.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `ToWorker`, `FromWorker` | None — new symbol (phase-file shape `…phase-1…md:259-267`) | phase shape plus optional fields | `index-host.ts` |
| `walk`, `summarizeFile`, `searchFile` | None — new symbol | internal | — |

**Existing Shape:** None — new file or symbol

```ts
None
```

The phase-file protocol is the baseline.

**Proposed Shape:**

```ts
export type ToWorker =
  | { t: "scan"; root: string; ignore: string[] }
  | { t: "changed"; paths: string[] } | { t: "removed"; paths: string[] }
  | { t: "search"; id: number; query: string; limit: number; mode?: "text" | "mentions"; names?: string[]; exclude?: string };
export type FromWorker =
  | { t: "batch"; summaries: NoteSummary[]; done: number; total: number; files?: string[] }
  | { t: "ready" }
  | { t: "results"; id: number; hits: SearchHit[]; capped?: boolean }
  | { t: "error"; message: string };

declare const self: Worker;
self.onmessage = (e: MessageEvent<ToWorker>) => { /* dispatch by e.data.t */ };
```

The worker handles each message as follows:

- **`scan`:** walks the root with `createExclusionMatcher` (hidden names, `node_modules`, nested `.gitignore`), the same rule as the explorer and watcher (`src/workspace/ignore.ts:21-58`). It counts files for `total`, then reads notes through `readTextFile`, at most 32 concurrently. Each note goes through `scanDoc` and `summarize`, and summaries are posted in batches of 500, with `files` (all paths, notes or not) in the first batches.
- **`changed`:** re-summarizes notes and posts a batch with `done = total = 0`, which marks an update.
- **`search`:**
  - `mode: "text"` reads notes and other text files through `readTextFile`, which skips binary and > 16 MiB files. It matches the query literally with smart-case, line by line, and stops at `limit` hits with `capped: true`.
  - `mode: "mentions"` searches notes other than `exclude` for whole-word, case-insensitive occurrences of `names`. It drops hits inside link ranges and `excluded` ranges from the note's scan, and inside frontmatter.
- **`removed`:** no reply. The main thread already removed the paths.

The worker caches note texts that are ≤ 1 MiB in memory after the scan, so mention and text searches do not re-read 10,000 files. A `changed` message refreshes those entries.

- **Invariants:**
  - The worker never writes.
  - Each `search` produces exactly one `results` with the same id.
  - An exception becomes an `error` message.
- **Verification Coverage:** S9 — V34; S11 — V36, V47; S17 — V34; S5 — V49, V50

## `src/app/index-host.ts`

- **Change:** Add
- **Decisions:** DES4
- **Requirements:** W261003FX70-REQ4@R1, W261003FX70-REQ5@R1
- **Responsibilities:** own the worker lifecycle and translate messages.
- **Affected Callers/Consumers:** `src/app/main.ts`, `src/app/effects.ts` (`search`)
- **Construction/Wiring:** constructed in `main` before the runner, started in the post-first-frame block
- **Dependencies:** `ToWorker`, `FromWorker`, `Logger`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `IndexHost`, `createIndexHost` | None — new symbol | as below | `main.ts`, `effects.ts` |

**Existing Shape:** None — new file or symbol

```ts
None
```

DI1 starts the watcher and detection in `setImmediate` (`src/app/main.ts:192-216`).

**Proposed Shape:**

```ts
export type IndexHost = {
  start(root: string, ignore: string[]): void;
  notify(e: FileEvent): void;            // watcher events → changed/removed for notes
  search(e: Extract<Effect, { kind: "search" }>): void;
  stop(): void;
};
export function createIndexHost(d: {
  dispatch: (a: Action) => void;
  logger: Logger;
  spawn?: () => Worker;                  // tests inject; default new Worker(new URL("../workspace/index-worker.ts", import.meta.url))
}): IndexHost;
```

`start` spawns the worker and posts `scan`. `batch`, `ready`, and `results` become `indexBatch`, `indexReady`, and `searchResults` (with `files ?? []` and `capped ?? false`). An `error` message, an `error` event, or a `close` before `stop` counts as a crash:

- **First crash:** dispatch `indexFailed {final: false}`, then spawn and rescan.
- **Second crash:** dispatch `{final: true}` and stop forwarding.

While the worker is unavailable, `search` answers immediately with an empty `searchResults {hits: [], capped: false}` (never `indexFailed`), and the picker's error row comes from `index.status`.

- **Invariants:**
  - At most one restart.
  - Message order is preserved per worker.
- **Verification Coverage:** S11 — V36, V47

## `src/core/state/index.ts`

- **Change:** Add
- **Decisions:** DES5
- **Requirements:** W261003FX70-REQ5@R1, W261003FX70-REQ4@R1
- **Responsibilities:** reducers for index actions, and main-thread index updates for `so`'s own changes.
- **Affected Callers/Consumers:** `update.ts`; `save.ts` `onSaved`; `explorer.ts` `onFsResult`; `disk.ts` `onFileChanged`; `link-edits.ts` `onEditsApplied`
- **Construction/Wiring:** None
- **Dependencies:** `note-index.ts`, `summarize.ts`, `scan.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `onIndexBatch`, `onIndexReady`, `onIndexFailed`, `summarizeSaved`, `indexAfterFsOp`, `indexAfterFileEvent`, `nextSearchId` | None — new symbol | as below | as above |

**Existing Shape:** None — new file or symbol

```ts
None
```

DI1 has no index state.

**Proposed Shape:**

```ts
export function onIndexBatch(s: AppState, a: Extract<Action, { type: "indexBatch" }>): Result;  // apply; status indexing; done/total
export function onIndexReady(s: AppState): Result;          // status ready; toast "index ready"
export function onIndexFailed(s: AppState, a: Extract<Action, { type: "indexFailed" }>): Result;  // final → unavailable + error toast
export function summarizeSaved(s: AppState, path: string): AppState;   // buffer not dirty and is a note → summarize(analysis.scan)
export function indexAfterFsOp(s: AppState, op: FsOp): AppState;       // create → addFiles; rename/move → movePaths; trash → removePaths
export function indexAfterFileEvent(s: AppState, e: FileEvent): AppState;  // removed → removePaths; changed non-note file → addFiles
export function nextSearchId(s: AppState): [AppState, number];
```

These functions are the only writers of `index`. `summarizeSaved` runs only when the buffer is clean after `saved`. A buffer typed in during the write is summarized at its next save, so the summary always matches disk. `onSaved` (`src/core/state/save.ts:123-154`), `onFsResult` (`src/core/state/explorer.ts:99-156`), and `onFileChanged` (`src/core/state/disk.ts:35`) each gain one call.

- **Invariants:**
  - A summary in the index describes the file's content on disk.
  - The worker never needs to see `so`'s own changes.
- **Verification Coverage:** S12 — V25, V37; S18 — V44

## `src/core/state/link-edits.ts`

- **Change:** Add
- **Decisions:** DES6
- **Requirements:** W261003FX70-REQ6@R1
- **Responsibilities:** gate link edits on index readiness, compute the prompt impact, start rewrites after the file operation, and aggregate results.
- **Affected Callers/Consumers:** `explorer.ts` (`startOp`, `promptKey`, `submit`, `onFsResult`), `features/links/commands.ts` (`file.rename`, `file.move`), `side-panel.ts`
- **Construction/Wiring:** None
- **Dependencies:** `rename.ts`, `buffers.ts` `applyBufferEdits`, `index.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `requireIndex`, `startRename`, `promptImpact`, `submitRename`, `beginRewrite`, `startMentionEdit`, `onEditsApplied` | None — new symbol | as below | as above |

**Existing Shape:** `src/core/state/explorer.ts:358-365` (the DI1 rename and move submit)

```ts
  const to =
    op.kind === "rename"
      ? join(dirname(op.from), value)
      : value.replace(/^\/+|\/+$/g, "");
  return to === op.from
    ? none(s)
    : explorerOp(s, { kind: op.kind, from: op.from, to }, now);
```

DI1 submits the file operation directly, and links are untouched.

**Proposed Shape:**

```ts
const NOT_READY = "index not ready — try again when indexing finishes";
const UNAVAILABLE = "links will not be updated (index unavailable)";

export function requireIndex(s: AppState): Result | undefined;            // idle|indexing → message(NOT_READY)
export function startRename(c: CommandContext, kind: "rename" | "move", from?: string): Result;  // prompt with impact
export function promptImpact(s: AppState, p: PromptState): PromptState;  // impact / invalid recomputed from value
export function submitRename(s: AppState, op: FsOp, now: number): Result;
export function beginRewrite(s: AppState, op: FsOp, now: number, reg: Registries): Result;   // after fsResult ok
export function startMentionEdit(s: AppState, edit: FileEdit, now: number, reg: Registries): Result;
export function onEditsApplied(s: AppState, a: Extract<Action, { type: "editsApplied" }>): Result;
```

These functions implement the edit pipeline:

- **Prompt.** `startRename` opens the DI1 prompt kinds with `impact` set from `renameImpact(planRename(…))`. `promptImpact` runs on every value change, and it also sets `invalid` (empty name, target already in `index.ix.files`, or outside the workspace). While `invalid` is set, `Enter` does nothing. When the index is unavailable, `impact` holds the warning and no plan is computed.
- **Submit.** `submitRename` stores `index.rewrite = {batch, op, edits: plan, …}`, then calls the existing `explorerOp`, which flushes writes and emits the file operation.
- **After the operation.** `beginRewrite` runs from `onFsResult` when `op` matches `index.rewrite.op`. It applies open-buffer edits through `applyBufferEdits`, emits one `applyEdits` per closed file, and records those paths as `pending`.
- **Results.** `onEditsApplied` moves each path to `updated` or `skipped`, summarizes `text` into the index, and on the last result emits the info toast `N files updated`. When anything was skipped, it also emits an error toast listing those paths.
- **Mentions.** `startMentionEdit` applies a single `FileEdit` the same way, with no file operation.

- **Invariants:**
  - No link edit is emitted before the file operation succeeds.
  - A batch emits exactly one summary toast.
- **Verification Coverage:** S7 — V24, V38; S8 — V24, V38; S10 — V24; S18 — V43, V45

## `src/core/state/explorer.ts`

- **Change:** Modify
- **Decisions:** DES5, DES6
- **Requirements:** W261003FX70-REQ5@R1, W261003FX70-REQ6@R1
- **Responsibilities:** explorer operations; DI2 routes rename and move through `link-edits.ts`.
- **Affected Callers/Consumers:** `commands.ts` (explorer commands), `keys.ts` (`promptKey`), `update.ts` (`onFsResult`)
- **Construction/Wiring:** None
- **Dependencies:** `link-edits.ts`, `index.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `startOp` | `src/core/state/explorer.ts:275-319` — prompts for a r m d | `rename`/`move` → `startRename(…, ex.cursor)`; create and delete unchanged | explorer commands |
| `promptKey` | `:322-337` — edits the value | after a value change on a rename or move prompt → `promptImpact`; `Enter` ignored while `invalid` | `keys.ts` |
| `submit` | `:339-365` — `explorerOp` | rename and move → `submitRename` | — |
| `onFsResult` | `:99-156` | calls `indexAfterFsOp` on success; when `index.rewrite.op` matches: ok → `beginRewrite`, failure → drop `rewrite` | `update.ts` |

**Existing Shape:** `src/core/state/explorer.ts:292-305`

```ts
  if (kind === "rename")
    return openPrompt(s, { kind: "input", title: "Rename", value: basename(from), op: { kind: "rename", from } });
  if (kind === "move")
    return openPrompt(s, { kind: "input", title: "Move to", value: from, op: { kind: "move", from } });
```

DI1 opens plain input prompts, and the result handler (`:113-130`) only re-paths buffers and the tree.

**Proposed Shape:**

```ts
  if (kind === "rename" || kind === "move") return startRename({ state: s, now, reg }, kind, from);
  // onFsResult, success branch:
  const indexed = indexAfterFsOp(s, op);
  const r = /* DI1 repath/relist result on `indexed` */;
  return s.index.rewrite?.op === op ? chain(r, (st) => beginRewrite(st, op, now, reg)) : r;
```

The explorer keeps its DI1 tree and buffer behaviour, and delegates link work. `onFsResult` compares the rewrite's `op` by identity, because the same `FsOp` object travels through the effect and back in `fsResult` (`src/app/effects.ts:120-138`).

- **Invariants:** Explorer create and trash behave as in DI1.
- **Verification Coverage:** S7 — V24; S10 — V24; S12 — V25; S18 — V45

## `src/app/effects.ts`

- **Change:** Modify
- **Decisions:** DES4, DES6, DES7, DES8, DES9
- **Requirements:** W261003FX70-REQ4@R1, W261003FX70-REQ6@R1, W261003FX70-REQ7@R1, W261003FX70-REQ8@R1, W261003FX70-REQ9@R1
- **Responsibilities:** run the new effects.
- **Affected Callers/Consumers:** `src/app/main.ts`, `test/integration/*`
- **Construction/Wiring:** `createEffectRunner(deps)` in `main.ts`
- **Dependencies:** `IndexHost`, `readConfigText`, `parseConfig`, `saveStateFile`, `readTextFile`, `atomicWrite`, `OwnOps`, `Logger`, `scanDoc` (none: the reducer scans written text)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `RunnerDeps` | `src/app/effects.ts:22-31` | adds `index: Pick<IndexHost, "search">`, `logger: Logger`, `configPath: string`, `statePath: string \| undefined` | `main.ts`, tests |
| `run` | `:141-227` | adds cases `search`, `applyEdits`, `readPreview`, `loadConfig`, `saveState`; logs effect failures | — |

**Existing Shape:** `src/app/effects.ts:166-183`

```ts
      case "write": {
        const before = [...unreported];
        void serial(async () => {
          const path = follow(e.path, before);
          if (path === null) { d.dispatch({ type: "saveFailed", path: e.path, reason: REMOVED }); return; }
          try {
            const stamp = await write(path, e.text, e.expected);
            d.ownOps.noteWrite(path, stamp);
            d.dispatch({ type: "saved", path, stamp });
          } catch (x) { d.dispatch({ type: "saveFailed", path, reason: msg(x) }); }
        });
        return;
      }
```

DI1 writes run on the serial queue, follow queued moves, and register own writes.

**Proposed Shape:**

```ts
      case "applyEdits": {
        const before = [...unreported];
        void serial(async () => {
          const path = follow(e.edit.path, before);
          const fail = (reason: string) => d.dispatch({ type: "editsApplied", batch: e.batch, path: e.edit.path, ok: false, reason });
          if (path === null) return fail("removed");
          const cur = await readTextFile(abs(path)).catch(() => ({ refused: "io" as const }));
          if ("refused" in cur) return fail(cur.refused);
          const next = applySpanEdits(cur.text, e.edit.edits);          // null when any span's text ≠ expected
          if (next === null) return fail("changed on disk");
          try {
            const stamp = await write(path, restoreFile(cur, next), cur.stamp);   // BOM and EOL restored, expected = stamp read
            d.ownOps.noteWrite(path, stamp);
            d.dispatch({ type: "editsApplied", batch: e.batch, path, ok: true, text: next, stamp });
          } catch (x) { fail(msg(x)); }
        });
        return;
      }
      case "search": d.index.search(e); return;
      case "readPreview":
        void readTextFile(abs(e.path)).catch(() => ({ refused: "io" as const }))
          .then((result) => d.dispatch({ type: "previewLoaded", id: e.id, path: e.path, result }));
        return;
      case "loadConfig":
        void readConfigText(d.configPath).then((text) =>
          d.dispatch({ type: "configLoaded", result: parseConfig(text ?? ""), reload: true }));
        return;
      case "saveState":
        if (d.statePath !== undefined) void saveStateFile(d.statePath, e.state).catch((x) => d.logger.error("state save failed", { reason: msg(x) }));
        return;
```

`applyEdits` runs four checks in one serial step:

1. It follows queued moves.
2. It reads the current file through `readTextFile`, which keeps the BOM and line-ending information.
3. It applies spans from last to first, but only if every span still holds its expected text.
4. It writes with `expected` set to the stamp it just read, so a change between the read and the rename fails as a conflict.

The write is registered as an own write, so the watcher stays silent and `onEditsApplied` updates the index (DES5). `applySpanEdits` and `restoreFile` are small pure helpers placed in `src/core/features/links/rename.ts` and `src/core/state/buffers.ts` (`saveText`'s BOM and EOL logic at `:64-73`), so the runner holds no text logic.

- **Invariants:**
  - Every new fallible effect dispatches exactly one action.
  - `applyEdits` never writes a file whose spans changed.
- **Verification Coverage:** S8 — V38; S11 — V36; S13 — V39; S16 — V40; S17 — V42

## `src/core/config/schema.ts`

- **Change:** Modify
- **Decisions:** DES7
- **Requirements:** W261003FX70-REQ7@R1
- **Responsibilities:** the strict config schema and defaults.
- **Affected Callers/Consumers:** `toml.ts`, `init.ts`, `keymap.ts`, `src/ui/{shell,theme}.ts`, `save.ts` (`autosave`)
- **Construction/Wiring:** None
- **Dependencies:** `zod`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `ConfigSchema` | `src/core/config/schema.ts:3-13` — four non-strict options | strict object with `leader`, `keys`, `filetypes`; exported | `toml.ts` |
| `AppConfig`, `defaults` | `:15-17` | same names, wider type | readers |

**Existing Shape:** `src/core/config/schema.ts:3-13`

```ts
const ConfigSchema = z.object({
  escTimeoutMs: z.number().int().min(0).default(50),
  autosave: z.object({ enabled: z.boolean().default(true), delayMs: z.number().int().min(0).default(1000) }).prefault({}),
  theme: z.enum(["dark", "light"]).default("dark"),
  color: z.enum(["auto", "never"]).default("auto"),
});
```

The DI1 schema is non-strict, so unknown keys pass silently, and it is not exported.

**Proposed Shape:**

```ts
const KeyTable = z.record(z.string().min(1), z.string().min(1));              // "<key-seq>" = "<command-id>"
const KeysByMode = z.record(z.string().min(1), KeyTable);                      // mode → table; modes validated against bindings later
export const ConfigSchema = z.strictObject({
  leader: z.string().refine((k) => splitKeys(k).length === 1, "leader must be one key").default(" "),
  escTimeoutMs: z.number().int().min(0).default(50),
  autosave: z.strictObject({ enabled: z.boolean().default(true), delayMs: z.number().int().min(0).default(1000) }).prefault({}),
  theme: z.enum(["dark", "light"]).default("dark"),
  color: z.enum(["auto", "never"]).default("auto"),
  keys: KeysByMode.default({}),
  filetypes: z.record(z.string().min(1), z.strictObject({ keys: KeysByMode.default({}) })).default({}),
});
export type AppConfig = z.infer<typeof ConfigSchema>;
export const defaults: AppConfig = ConfigSchema.parse({});
```

`strictObject` turns unknown keys into zod issues with a path, which `parseConfig` maps to lines. `leader` is checked with the kernel `splitKeys`, so `"<space>"` and `","` are both one key.

- **Invariants:** `defaults` parses `{}`.
- **Verification Coverage:** S13 — V18, V19

## `src/core/config/toml.ts`

- **Change:** Add
- **Decisions:** DES7
- **Requirements:** W261003FX70-REQ2@R1, W261003FX70-REQ7@R1
- **Responsibilities:** TOML text → `ConfigResult` with lines.
- **Affected Callers/Consumers:** `src/app/main.ts` (startup), `src/app/effects.ts` (`loadConfig`)
- **Construction/Wiring:** None
- **Dependencies:** `toml-eslint-parser` (`parseTOML`, `getStaticTOMLValue`), `schema.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `ConfigError`, `BindingSource`, `ConfigResult`, `parseConfig` | None — new symbol | as below | `main.ts`, `effects.ts`, `config.ts` |

**Existing Shape:** None — new file or symbol

```ts
None
```

DI1 never reads a config file (`src/core/state/init.ts:40` seeds `defaults`).

**Proposed Shape:**

```ts
export type ConfigError = { line: number; message: string };
export type BindingSource = { mode: string; filetype?: string; seq: string; id: string; line: number };
export type ConfigResult =
  | { ok: true; config: AppConfig; bindings: BindingSource[] }
  | { ok: false; errors: ConfigError[] };

export function parseConfig(text: string): ConfigResult {
  let ast;
  try { ast = parseTOML(text); }
  catch (e) { return { ok: false, errors: [{ line: (e as { lineNumber: number }).lineNumber, message: (e as Error).message }] }; }
  const parsed = ConfigSchema.safeParse(getStaticTOMLValue(ast));
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => ({ line: lineOf(ast, i.path), message: describe(i) })) };
  return { ok: true, config: parsed.data, bindings: bindingSources(ast, parsed.data) };
}
```

`parseTOML` throws with `lineNumber` on a syntax error, which is how V4 (c) gets `config.toml:7`.

Schema issues carry a key path. `lineOf` walks the AST's tables and key-values (each with `loc.start.line`) to find the deepest node on that path. For an unrecognized key, zod reports the parent path plus the key name, and the walk finds the key itself.

`bindingSources` records the line of every `keys` and `filetypes.*.keys` entry, so `validateBindings` can report an unknown command id, file type, or mode at its line.

The parser lives in pure core because it does no I/O, and the boundary allowlist (V35) confines the package to `src/core/config/`.

- **Invariants:** Every error has a line ≥ 1, and errors are in source order.
- **Verification Coverage:** S13 — V17, V18, V19

## `src/core/state/config.ts`

- **Change:** Add
- **Decisions:** DES7
- **Requirements:** W261003FX70-REQ7@R1
- **Responsibilities:** apply a `ConfigResult`, or report its errors.
- **Affected Callers/Consumers:** `update.ts`; `config.reload` command
- **Construction/Wiring:** None
- **Dependencies:** `Registries`, `toml.ts` types

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `onConfigLoaded`, `validateBindings`, `reloadConfig` | None — new symbol | as below | `update.ts`, `commands.ts` |

**Existing Shape:** None — new file or symbol

```ts
None
```

DI1 has no config state transitions.

**Proposed Shape:**

```ts
export function validateBindings(reg: Registries, b: readonly BindingSource[]): ConfigError[];  // unknown command id / file type / mode
export function onConfigLoaded(s: AppState, a: Extract<Action, { type: "configLoaded" }>, reg: Registries): Result {
  const errors = a.result.ok ? validateBindings(reg, a.result.bindings) : a.result.errors;
  if (errors.length === 0 && a.result.ok) return none({ ...s, config: a.result.config });
  const [first] = errors;
  const text = `config.toml:${first?.line}: ${first?.message}${errors.length > 1 ? ` (+${errors.length - 1} more)` : ""}`;
  return toast(a.reload ? s : { ...s, config: defaults }, "error", text);
}
export const reloadConfig = (c: CommandContext): Result => ({ state: c.state, effects: [{ kind: "loadConfig" }] });
```

The config applies whole or not at all. Valid modes are the DI1 modes plus `explorer`. File-type ids come from `reg.fileTypes`.

- **Invariants:** `state.config` is always a fully valid config.
- **Verification Coverage:** S13 — V18, V39

## `src/core/state/keymap.ts`

- **Change:** Add
- **Decisions:** DES7
- **Requirements:** W261003FX70-REQ7@R1, W261003FX70-REQ1@R1
- **Responsibilities:** derive the effective bindings and trie per config.
- **Affected Callers/Consumers:** `keys.ts` (lookup), `whichkey.ts`, `picker.ts` (help and commands sources)
- **Construction/Wiring:** None — module-level `WeakMap<AppConfig, …>` memo
- **Dependencies:** kernel `Keymap`, `Registries`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `effectiveBindings`, `keymapFor` | None — new symbol | as below | as above |

**Existing Shape:** `src/app/main.ts:84-85`

```ts
  const keymap = new Keymap();
  for (const b of defaultBindings) keymap.bind(b.scope, b.seq, b.id);
```

DI1 builds one trie at startup.

**Proposed Shape:**

```ts
export function effectiveBindings(reg: Registries, config: AppConfig): readonly Binding[];  // registered + config (overridden: true)
export function keymapFor(reg: Registries, config: AppConfig): Keymap {
  // memoized per (reg, config) object: new Keymap({ leader: config.leader }) bound with effectiveBindings
}
```

A config binding with the same scope and sequence replaces the registered one and carries `overridden: true`. Help and the palette show the `●` marker from this flag. Memoizing by config identity means one trie per loaded config, and reload swaps it implicitly.

- **Invariants:** `keymapFor` returns the same object for the same config object.
- **Verification Coverage:** S13 — V20; S15 — V42

## `src/core/kernel/commands/keymap.ts` and `src/core/kernel/vim/keys.ts`

- **Change:** Modify
- **Decisions:** DES7
- **Requirements:** W261003FX70-REQ7@R1
- **Responsibilities:** a configurable leader.
- **Affected Callers/Consumers:** `keymapFor`; tests that call `splitKeys` (`test/vim/vim.test.ts:73`, `test/support/ui.ts`)
- **Construction/Wiring:** None
- **Dependencies:** None

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `NAMED` | `src/core/kernel/vim/keys.ts:7-16` — `"<leader>": " "` | the `<leader>` entry is removed | `splitKeys` |
| `splitKeys` | `:19-33` — `(seq)` | `(seq, leader = " ")` maps `<leader>` to `leader` | `Keymap.bind`, tests |
| `Keymap` | `src/core/kernel/commands/keymap.ts:21-38` — `new Keymap()` | `new Keymap({ leader = " " } = {})`; `bind` passes the leader | `keymapFor`, tests |

**Existing Shape:** `src/core/kernel/vim/keys.ts:7-10`

```ts
const NAMED: Record<string, Key> = {
  "<lt>": "<",
  "<space>": " ",
  "<leader>": " ",
```

DI1 hard-codes Space as the leader.

**Proposed Shape:**

```ts
export function splitKeys(seq: string, leader: Key = " "): Key[];   // "<leader>" → leader; other names as before
export class Keymap {
  constructor(private readonly opts: { leader?: Key } = {}) {}
  bind(scope: KeyScope, seq: string, commandId: string): void;      // splitKeys(seq, this.opts.leader ?? " ")
  lookup(scope: KeyScope, pending: Key[]): Lookup;                    // unchanged
}
```

The leader is data passed in, so the kernel stays language-neutral and the default behaviour is unchanged.

- **Invariants:** Without options, the trie behaves exactly as in DI1.
- **Verification Coverage:** S13 — V20

## `src/workspace/config-file.ts`

- **Change:** Add
- **Decisions:** DES7
- **Requirements:** W261003FX70-REQ7@R1
- **Responsibilities:** the XDG config path and reading the text.
- **Affected Callers/Consumers:** `main.ts`, `effects.ts`
- **Construction/Wiring:** None
- **Dependencies:** `node:path`, `node:os`, `node:fs`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `configPath`, `readConfigText`, `readConfigTextSync` | None — new symbol | as below | `main.ts`, `effects.ts` |

**Existing Shape:** None — new file or symbol

```ts
None
```

DI1 does not read a config file.

**Proposed Shape:**

```ts
/** $XDG_CONFIG_HOME/so/config.toml when absolute; otherwise ~/.config/so/config.toml (XDG Base Directory 0.8). */
export function configPath(env: Record<string, string | undefined>, home: string): string;
export function readConfigTextSync(path: string): string | undefined;      // ENOENT → undefined
export function readConfigText(path: string): Promise<string | undefined>;
```

The startup read is synchronous, because the first frame needs the theme and leader. Reload is asynchronous. A missing file is not an error.

- **Invariants:** A relative or empty `XDG_CONFIG_HOME` is ignored.
- **Verification Coverage:** S13 — V31

## `src/workspace/log.ts`

- **Change:** Add
- **Decisions:** DES7
- **Requirements:** W261003FX70-REQ7@R1
- **Responsibilities:** the debug log.
- **Affected Callers/Consumers:** `main.ts`, `effects.ts`, `index-host.ts`
- **Construction/Wiring:** `createLogger(process.env, home)` in `main`
- **Dependencies:** `node:fs` (append), the state directory rule from `state-file.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `Logger`, `createLogger` | None — new symbol | as below | app modules |

**Existing Shape:** None — new file or symbol

```ts
None
```

DI1 has no logger; `SO_LOG` was deferred to DI2 (`w261003hege-system-design.md:294`).

**Proposed Shape:**

```ts
export type Logger = { info(event: string, fields?: Record<string, string | number | boolean>): void; error(event: string, fields?: Record<string, string | number | boolean>): void };
/** SO_LOG=debug → append JSON lines to $XDG_STATE_HOME/so/so.log (created 0600); otherwise every call is a no-op. */
export function createLogger(env: Record<string, string | undefined>, home: string): Logger;
```

Fields are restricted to scalars, and call sites pass paths, counts, durations, and reasons only. Effects carrying note text (`write`, `applyEdits`, `saveState`) are never logged with their payload. The type does not stop a caller from passing text, so V41 checks the log of a real run against the workspace text.

- **Invariants:** Without `SO_LOG=debug` no file is created.
- **Verification Coverage:** S14 — V33, V41

## `src/core/kernel/commands/defaults.ts`

- **Change:** Modify
- **Decisions:** DES7, DES8, DES9
- **Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ8@R1
- **Responsibilities:** built-in global bindings and group labels.
- **Affected Callers/Consumers:** `main.ts` `registries`, `testRegistries`
- **Construction/Wiring:** concatenated into `Registries.bindings`
- **Dependencies:** `keymap.ts` types

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `Binding` | None — new symbol (inline type at `src/core/kernel/commands/defaults.ts:7-11`) | exported `{ scope: KeyScope; seq: string; id: string; overridden?: true }` | `keymap.ts` (state), help |
| `defaultBindings` | `:7-29` — explorer, window, `<leader>e` | adds global DI2 bindings below | — |
| `defaultGroups` | None — new symbol | `{ "<leader>f": "find", "<leader>s": "search", "<leader>b": "buffer", "<leader>w": "window", "<leader>u": "ui" }` | which-key |

**Existing Shape:** `src/core/kernel/commands/defaults.ts:12-13`

```ts
  { scope: { mode: "normal" }, seq: "<leader>e", id: "explorer.toggle" },
  { scope: { mode: "normal" }, seq: "<C-w>h", id: "window.focush" },
```

DI1 binds only the explorer toggle under the leader.

**Proposed Shape:**

```ts
  { scope: { mode: "normal" }, seq: "<leader>ff", id: "file.find" },
  { scope: { mode: "normal" }, seq: "<leader>fr", id: "file.recent" },
  { scope: { mode: "normal" }, seq: "<leader>sg", id: "search.grep" },
  { scope: { mode: "normal" }, seq: "<leader>st", id: "search.tags" },
  { scope: { mode: "normal" }, seq: "<leader>sc", id: "command.palette" },
  { scope: { mode: "normal" }, seq: "<leader>:", id: "command.palette" },
  { scope: { mode: "normal" }, seq: "<leader>?", id: "help.keymap" },
  { scope: { mode: "normal" }, seq: "<C-o>", id: "jump.back" },
  { scope: { mode: "normal" }, seq: "<C-i>", id: "jump.forward" },
  { scope: { mode: "normal" }, seq: "<Tab>", id: "jump.forward" },
```

These are the leader-map assumptions accepted in `ui-mockups/manifest.md:40-46`. Note-only keys are added by `linkBindings` in the `markdown` scope. `<Tab>` is bound because legacy terminals send `<C-i>` as Tab, as Neovim treats them.

- **Invariants:** No note command id appears here.
- **Verification Coverage:** S15 — V42; S16 — V27

## `src/core/state/commands.ts`

- **Change:** Modify
- **Decisions:** DES7, DES8, DES9
- **Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ7@R1, W261003FX70-REQ8@R1
- **Responsibilities:** built-in commands, ex aliases, and `:` execution.
- **Affected Callers/Consumers:** `keys.ts`, `src/core/state/keys.test.ts:198`
- **Construction/Wiring:** `registerBuiltins` (`src/core/state/commands.ts:354-358`)
- **Dependencies:** `picker.ts`, `jumps.ts`, `config.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `EX_ALIASES` | `src/core/state/commands.ts:45-67` — `w`/`write` → `buffer.write` | `w`/`write` → `file.save`; adds `help` → `help.keymap`, `ConfigReload` → `config.reload`, `jumps` → `jump.list` | `executeEx`, `cmdlineCompletions` |
| `executeEx` | `:92-106` — aliases only | a typed word equal to a registered command id runs that command (with the file-type check) | `keys.ts` |
| `builtins` | `:260-352` | `buffer.write` renamed `file.save` (title "Save file"); adds `file.find`, `file.recent`, `search.grep`, `command.palette`, `help.keymap`, `config.reload`, `jump.back`, `jump.forward`, `jump.list` | registry |
| `editFile` | `:196-204` | pushes a jump before `openPath` | — |

**Existing Shape:** `src/core/state/commands.ts:100-105`

```ts
  const ex = parseEx(typed);
  if (ex !== undefined && "pattern" in ex) return substitute(s, ex, now);
  const id = ex && EX_ALIASES[ex.cmd + (ex.bang ? "!" : "")];
  if (ex === undefined || id === undefined)
    return message(s, `E492: Not an editor command: ${typed}`, "error");
  return runCommand(s, id, now, reg, ex.arg);
```

DI1 completes command ids after `:` (`src/core/state/keys.ts:113-121`), but `executeEx` cannot run them: `parseEx` reads `link.follow` as command `link`, which gives E492. V4 (i) needs `:link.follow` to reach the file-type notice.

**Proposed Shape:**

```ts
  const word = typed.split(/\s+/, 1)[0] ?? "";
  if (reg.commands.get(word) !== undefined)
    return runCommand(s, word, now, reg, typed.slice(word.length).trim() || undefined);
  const ex = parseEx(typed);
  // … DI1 alias path unchanged …
```

A registered id wins only on an exact match. Ex names keep precedence in completion, and Vim aliases still run as before.

- **Invariants:** `E492` remains for unknown words.
- **Verification Coverage:** S15 — V22; S16 — V27

## `src/core/state/keys.ts`

- **Change:** Modify
- **Decisions:** DES7, DES8, DES9
- **Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ8@R1, W261003FX70-REQ9@R1
- **Responsibilities:** key routing for the new overlays, the side panel, which-key, and jumps.
- **Affected Callers/Consumers:** `update.ts`
- **Construction/Wiring:** None
- **Dependencies:** `whichkey.ts`, `picker.ts`, `completion.ts`, `side-panel.ts`, `keymap.ts`, `jumps.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `handleKeyAction` | `src/core/state/keys.ts:28-52` | routes `whichKey`, `picker`/`palette`/`help`, and `completion` overlays and the focused side panel first; lookup through `keymapFor(reg, s.config)`; `prefix` → `armWhichKey` | `update.ts` |
| `applyVimEffects` | `:185-233` | handles `jumped` → `pushJump`; after an Insert-mode key, `maybeOpenCompletion` | — |
| `cmdlineCompletions` | `:113-121` | unchanged rule; ids now include DI2 commands filtered by `list(fileType)` | — |

**Existing Shape:** `src/core/state/keys.ts:33-47`

```ts
  if (s.overlay.kind === "conflict") return conflictKey(s, a);
  if (s.overlay.kind === "prompt") return promptKey(s, a.key, a.now);
  if (s.vim.mode === "cmdline" && s.vim.cmdline.startsWith(":")) return cmdlineKey(s, a, reg);
  // …
  const hit = reg.keymap.lookup(scope, seq);
  if (hit.kind === "command") return runCommand(setVim(s, { pending: [] }), hit.id, a.now, reg);
  if (hit.kind === "prefix") return none(setVim(s, { pending: seq }));
```

DI1 routes two overlays, then the keymap, then the engine. A pending prefix shows nothing.

**Proposed Shape:**

```ts
  switch (s.overlay.kind) {
    case "conflict": return conflictKey(s, a);
    case "prompt": return promptKey(s, a.key, a.now);
    case "whichKey": return whichKeyKey(s, a, reg);
    case "picker": case "palette": case "help": return pickerKey(s, a, reg);
    case "completion": { const r = completionKey(s, a, reg); if (r !== undefined) return r; break; }   // unhandled keys fall to Insert
  }
  if (s.panels.side.open && s.panels.side.focused) return sidePanelKey(s, a, reg);
  // … ":" line as DI1 …
  const hit = keymapFor(reg, s.config).lookup(scope, seq);
  if (hit.kind === "command") return runCommand(setVim(s, { pending: [] }), hit.id, a.now, reg);
  if (hit.kind === "prefix") return armWhichKey(setVim(s, { pending: seq }), scope);
```

The completion popup lets typing continue: `completionKey` handles only the list keys (`Ctrl-n`/`Ctrl-p`, `Enter`, `Tab`, `Esc`). It returns `undefined` for other keys, which reach the Insert engine and re-filter afterwards. Every other overlay owns its keys.

- **Invariants:** Exactly one router handles each key.
- **Verification Coverage:** S15 — V21, V22, V42; S16 — V27; S18 — V23

## `src/core/kernel/vim/types.ts` and `src/core/kernel/vim/engine.ts`

- **Change:** Modify
- **Decisions:** DES8
- **Requirements:** W261003FX70-REQ8@R1
- **Responsibilities:** signal Neovim jump motions.
- **Affected Callers/Consumers:** `src/core/state/keys.ts` `applyVimEffects`, `test/vim/vim.test.ts` (engine-level test filters effects)
- **Construction/Wiring:** None
- **Dependencies:** None

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `VimEffect` | `src/core/kernel/vim/types.ts:59-65` | adds `{ kind: "jumped"; from: Pos }` | `applyVimEffects` |
| `moveCursor` | `src/core/kernel/vim/engine.ts:174-179` | pushes `jumped` when the motion key ∈ `JUMP_MOTIONS` and the motion succeeded | — |
| `cmdlineKey` search commit | `:640-648` | pushes `jumped` before moving to the match | — |
| `JUMP_MOTIONS` | None — new symbol | `G gg n N * # % { }` | `moveCursor` |

**Existing Shape:** `src/core/kernel/vim/engine.ts:174-179`

```ts
function moveCursor(run: Run, cmd: ParsedCommand, env: VimEnv): void {
  const res = runMotion(run, cmd.target ?? "", cmd, env);
  if (res === null) return;
  setCursor(run, res.to);
  if (res.want !== undefined) updateVim(run, { wantCol: res.want });
}
```

DI1's engine has no notion of jumps.

**Proposed Shape:**

```ts
const JUMP_MOTIONS = new Set(["G", "gg", "n", "N", "*", "#", "%", "{", "}"]);
function moveCursor(run: Run, cmd: ParsedCommand, env: VimEnv): void {
  const res = runMotion(run, cmd.target ?? "", cmd, env);
  if (res === null) return;
  if (JUMP_MOTIONS.has(cmd.target ?? "")) run.effects.push({ kind: "jumped", from: run.s.cursor });
  setCursor(run, res.to);
  if (res.want !== undefined) updateVim(run, { wantCol: res.want });
}
```

The set covers the jump motions DI1 implements that Neovim records in its jumplist. The state layer owns the list, so the kernel only reports where the cursor jumped from. Operator-pending motions (`dG`) do not push, matching Neovim.

- **Invariants:** Existing recorded vim cases are unchanged (the effect is ignored by text, cursor, and register comparisons).
- **Verification Coverage:** S16 — V27

## `src/core/state/jumps.ts` and `src/core/state/recent.ts`

- **Change:** Add
- **Decisions:** DES8
- **Requirements:** W261003FX70-REQ8@R1
- **Responsibilities:** the jump list and recent files.
- **Affected Callers/Consumers:** `keys.ts`, `commands.ts` (`jump.*`, `file.edit`), `buffers.ts` `onFileLoaded`, picker accept, `link.follow`, `status.ts`
- **Construction/Wiring:** None
- **Dependencies:** `buffers.ts` `openPath`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `pushJump`, `jumpBack`, `jumpForward`, `jumpSegment`, `JUMP_LIMIT` | None — new symbol | as below | as above |
| `touchRecent`, `RECENT_LIMIT` | None — new symbol | as below | `onFileLoaded`, `showBuffer` callers |

**Existing Shape:** None — new file or symbol

```ts
None
```

There is no jump list or recents in DI1.

**Proposed Shape:**

```ts
export const JUMP_LIMIT = 100;
/** Neovim: truncate forward history at `at`, drop an entry on the same path and line, append, cap at 100. */
export function pushJump(j: JumpList, e: JumpEntry): JumpList;
/** At the end, first records `current` (so <C-i> returns); then moves to entries[at − 1]. */
export function jumpBack(s: AppState, now: number): Result;
export function jumpForward(s: AppState, now: number): Result;
export function jumpSegment(j: JumpList): string | undefined;      // "jump 2/2" after any jump; undefined when empty

export const RECENT_LIMIT = 100;
export function touchRecent(recent: readonly string[], path: string): string[];   // move to front, dedupe, cap
```

`jumpBack` and `jumpForward` reuse `openPath` for another file, then position the cursor. When the target buffer must load first, a pending cursor goes on the `windows.restore` path, the same mechanism as session restore. The recorded Neovim cases are the oracle for the in-buffer behaviour.

- **Invariants:** `entries.length ≤ 100`, `0 ≤ at ≤ entries.length`, and no two adjacent entries are on the same path and line.
- **Verification Coverage:** S16 — V26, V27, V43

## `src/core/state/session.ts` and `src/workspace/state-file.ts`

- **Change:** Add
- **Decisions:** DES8
- **Requirements:** W261003FX70-REQ8@R1
- **Responsibilities:** persisted shape, snapshot, restore; the state file adapter.
- **Affected Callers/Consumers:** `update.ts` (`sessionChanged`, `stateLoaded`), `effects.ts` (`saveState`), `main.ts`, `lifecycle.ts`
- **Construction/Wiring:** `statePath(env, home, realpath(root))` in `main`
- **Dependencies:** `zod` (core), `node:crypto` `createHash` (workspace), `atomicWrite` (workspace)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `PersistedState`, `parsePersisted`, `snapshotSession`, `sessionChanged`, `onStateLoaded` | None — new symbol | as below | as above |
| `statePath`, `readStateFile`, `saveStateFile`, `saveStateFileSync` | None — new symbol | as below | `main.ts`, `effects.ts`, `lifecycle.ts` |

**Existing Shape:** None — new file or symbol

```ts
None
```

DI1 persists nothing.

**Proposed Shape:**

```ts
// src/core/state/session.ts
export type PersistedState = {
  version: 1; recent: string[]; jumps: JumpList; buffers: { path: string; view: string }[];
  layout: { tree: WindowTree; active: WindowId; windows: { id: WindowId; path: string; cursor: Pos; scroll: number }[] };
};
export function parsePersisted(json: unknown): PersistedState | undefined;   // zod; wrong version or shape → undefined
export function snapshotSession(s: AppState): PersistedState;
export function sessionChanged(prev: AppState, next: AppState): boolean;     // recent, jumps, tree, shown paths
export function onStateLoaded(s: AppState, a: Extract<Action, { type: "stateLoaded" }>): Result;

// src/workspace/state-file.ts
export function statePath(env: Record<string, string | undefined>, home: string, realRoot: string): string;
  // <$XDG_STATE_HOME or ~/.local/state>/so/<sha256(realRoot).slice(0,16)>/state.json
export function readStateFile(path: string): unknown;                         // missing or invalid JSON → undefined
export function saveStateFile(path: string, state: PersistedState): Promise<void>;   // mkdir -p 0700; atomicWrite mode 0600
export function saveStateFileSync(path: string, state: PersistedState): void; // shutdown path
```

The two files split the work:

- **`onStateLoaded`** sets `recent` and `jumps`. With `restore`, it rebuilds `windows.tree`, assigns each window a pending `{path, cursor, scroll}` in `windows.restore`, and emits one `read` per distinct path. `onFileLoaded` fills every window waiting on that path, clamping the cursor. `fileRefused` for a pending path increments `missing`. When `pending` empties, `missing > 0` produces one toast.
- **Hashing** of the real root happens in the workspace adapter (`node:crypto` is I/O-side), so core never imports runtime APIs.

- **Invariants:**
  - The state path never lies inside the workspace (V32).
  - No note text is persisted.
- **Verification Coverage:** S16 — V28, V32, V40

## `src/app/lifecycle.ts`

- **Change:** Modify
- **Decisions:** DES8
- **Requirements:** W261003FX70-REQ8@R1
- **Responsibilities:** save the session on every shutdown path.
- **Affected Callers/Consumers:** `main.ts`
- **Construction/Wiring:** `installLifecycle({ store, shell, runner, saveSession })`
- **Dependencies:** `snapshotSession`, `saveStateFileSync`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `installLifecycle` | `src/app/lifecycle.ts:17-54` — flushes writes, then restores the terminal | also calls `saveSession(store.get())` (try/catch, logged) before `shell.destroy()`, for signals, crashes, and `exitNow` | `main.ts` |

**Existing Shape:** `src/app/lifecycle.ts:24-38`

```ts
  const shutdown = async (code: number, flush: boolean, error?: unknown) => {
    if (done) return;
    done = true;
    const writes = flush ? pendingWrites(d.store.get()) : [];
    // … flush bounded by FLUSH_BOUND_MS …
    d.shell.destroy();
```

The DI1 shutdown flushes buffers only when `flush` is true; the `:q` path (`exitNow`) has already saved.

**Proposed Shape:**

```ts
export function installLifecycle(d: {
  store: Store; shell: Shell; runner: EffectRunner; exit?: (code: number) => void;
  saveSession?: (s: AppState) => void;     // synchronous, small file
}): { exitNow(code: number): void };
  // in shutdown, after the bounded flush and before d.shell.destroy():
  try { d.saveSession?.(d.store.get()); } catch { /* logged by the caller's wrapper */ }
```

The state file is saved on every exit path, including `:q`. The synchronous write is a few kilobytes, so it does not threaten the restore bound.

- **Invariants:** The terminal restore still happens if the save throws.
- **Verification Coverage:** S16 — V40; S20 — V48 (V17 restore re-pass)

## `src/core/state/whichkey.ts`

- **Change:** Add
- **Decisions:** DES9
- **Requirements:** W261003FX70-REQ1@R1
- **Responsibilities:** which-key timing, rows, and key handling.
- **Affected Callers/Consumers:** `keys.ts`, `update.ts` (`whichKey` timer), `WhichKeyView`
- **Construction/Wiring:** None
- **Dependencies:** `keymap.ts`, `Registries.groups`, command titles

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `WHICH_KEY_MS`, `armWhichKey`, `onWhichKeyTimer`, `whichKeyKey`, `whichKeyRows` | None — new symbol | as below | as above |

**Existing Shape:** `src/core/state/keys.ts:46` — `if (hit.kind === "prefix") return none(setVim(s, { pending: seq }));`

```ts
None
```

DI1 keeps the pending prefix and shows nothing.

**Proposed Shape:**

```ts
export const WHICH_KEY_MS = 300;
export function armWhichKey(s: AppState, scope: KeyScope): Result;          // startTimer whichKey 300 (restarts per key)
export function onWhichKeyTimer(s: AppState, reg: Registries): Result;      // still a prefix → overlay whichKey{prefix, scope}
export function whichKeyKey(s: AppState, a: { key: Key; now: number }, reg: Registries): Result;
export type WhichKeyRow = { key: Key; label: string; group: boolean };
export function whichKeyRows(s: AppState, reg: Registries): WhichKeyRow[];  // direct actions (command title) first, then "+group", alphabetical within
```

The timer is restarted on every prefix key, and `onWhichKeyTimer` checks that `vim.pending` is still a prefix. A sequence completed within 300 ms therefore never shows the popup, and the timer needs no stored timestamp. Group labels come from `Registries.groups` (`+find`, `+links`). A group shows only when it has bindings in the current scope, which is why `sync.ts` shows no `+links`.

- **Invariants:** The overlay never opens before 300 ms of idle prefix.
- **Verification Coverage:** S15 — V21, V42

## `src/core/state/picker.ts`

- **Change:** Add
- **Decisions:** DES9
- **Requirements:** W261003FX70-REQ9@R1, W261003FX70-REQ1@R1, W261003FX70-REQ8@R1
- **Responsibilities:** picker sources, ranking, keys, search, and preview requests.
- **Affected Callers/Consumers:** `commands.ts` (`file.find`, `file.recent`, `search.grep`, `command.palette`, `help.keymap`), `features/links/commands.ts` (`search.*`), `side-panel.ts` (narrow backlinks), `keys.ts`, `update.ts`, `PickerView`
- **Construction/Wiring:** `pickerSources` is a static record in the module
- **Dependencies:** `fuzzy.ts`, `note-index.ts`, `keymap.ts`, `jumps.ts`, `buffers.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `PickerSource`, `pickerSources`, `openPicker`, `pickerKey`, `onSearchTimer`, `onSearchResults`, `onPreviewLoaded`, `GREP_LIMIT`, `SEARCH_DEBOUNCE_MS`, `PREVIEW_MIN_COLS` | None — new symbol | as below | as above |

**Existing Shape:** None — new file or symbol

```ts
None
```

DI1 has no pickers.

**Proposed Shape:**

```ts
export const GREP_LIMIT = 1000;
export const SEARCH_DEBOUNCE_MS = 100;
export const PREVIEW_MIN_COLS = 100;

export type PickerSource = {
  id: string;
  title: string;
  overlay?: "palette" | "help";
  /** Ranked items for `query`; grep returns the current results unchanged and schedules a search instead. */
  items(s: AppState, reg: Registries, query: string, arg?: string): PickerItem[];
  accept(s: AppState, item: PickerItem, now: number, reg: Registries): Result;
  /** File-based sources: the path and line to preview. */
  preview?(item: PickerItem): { path: string; line: number } | undefined;
};
export const pickerSources: Readonly<Record<string, PickerSource>>;
  // files: index.ix.files ∪ open buffer paths, recent-first when the query is empty
  // recent: s.recent ∩ index files (hides missing); headings: analysis.scan.headings of the active note
  // tags: tagCounts; tagNotes: notesWithTag(arg); backlinks: backlinksOf(arg) + unlinked hits
  // grep: search results "path:line"; commands: commands.list(fileType) with binding and ● from effectiveBindings
  // help: effectiveBindings grouped, scope label for file-type bindings, ● overrides
export function openPicker(c: CommandContext, id: string, arg?: string): Result;
export function pickerKey(s: AppState, a: { key: Key; now: number }, reg: Registries): Result;
export function onSearchTimer(s: AppState): Result;          // emits search{id: nextSearchId, query, limit: GREP_LIMIT}
export function onSearchResults(s: AppState, a: Extract<Action, { type: "searchResults" }>): Result;  // picker or side panel by id
export function onPreviewLoaded(s: AppState, a: Extract<Action, { type: "previewLoaded" }>): Result;
```

Every list overlay is one `PickerState` plus one `PickerSource`, so a new picker is a registration (RM261003ABZP-REQ11@R3):

- **Keys.** `pickerKey` edits the query and moves the selection (`Ctrl-n`/`Ctrl-p`, arrows, `Ctrl-d`/`Ctrl-u`). `Enter` calls `accept`, and `Esc` closes.
- **Grep.** Each query change restarts the `search` timer. `onSearchTimer` emits `search` with a fresh id and an empty query emits nothing. `onSearchResults` ignores ids other than `picker.search.id` or `panels.side.mentions.id`.
- **Preview.** A preview is requested only when `terminal.cols ≥ 100`, the source has `preview`, and no open buffer has the path; an open buffer's text is used directly. Because `preview.id` changes with every selection, a late `previewLoaded` for an older selection is dropped.
- **Jumps.** `accept` for file-based sources calls `pushJump` before `openPath`.

- **Invariants:**
  - The `commands` and `help` sources list only commands available for the active file type.
  - Ranking uses `rankBy` only.
- **Verification Coverage:** S17 — V29, V42; S15 — V22, V42; S16 — V28 (recent)

## `src/core/state/completion.ts`

- **Change:** Add
- **Decisions:** DES9
- **Requirements:** W261003FX70-REQ1@R1
- **Responsibilities:** `[[` completion in Insert mode.
- **Affected Callers/Consumers:** `keys.ts` (`applyVimEffects` after Insert keys; overlay routing), `CompletionView`
- **Construction/Wiring:** None
- **Dependencies:** `note-index.ts`, `resolve.ts`, `fuzzy.ts`, `analysis.scan`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `maybeOpenCompletion`, `completionKey`, `COMPLETION_ROWS` | None — new symbol | as below | `keys.ts` |

**Existing Shape:** None — new file or symbol

```ts
None
```

DI1 has no completion.

**Proposed Shape:**

```ts
export const COMPLETION_ROWS = 8;
/** In a Markdown buffer in Insert mode: "[[" just typed → open; text after "[[" with "#" → headings, "#^" → blocks of the resolved target. */
export function maybeOpenCompletion(s: AppState): AppState;
/** List keys only; undefined for keys that should reach the Insert engine. Enter/Tab insert the item + "]]" as part of the Insert session. */
export function completionKey(s: AppState, a: { key: Key; now: number }, reg: Registries): Result | undefined;
```

Candidates are notes (`linkText` from the current note) and aliases (`alias → target`) for `notes` mode. For `headings` and `blocks`, they come from the target's summary, or from the live scan when the target is the current note. The insertion runs through the engine's Insert typing, so it stays inside the same undo block as the `[[` typed by the user. Placement above or below the cursor line is a UI concern (`CompletionView`).

- **Invariants:** The popup closes when the cursor leaves the `[[…` span or the mode leaves Insert.
- **Verification Coverage:** S18 — V23, V43

## `src/core/state/side-panel.ts`

- **Change:** Add
- **Decisions:** DES9
- **Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ6@R1
- **Responsibilities:** backlinks and outline panel state, keys, and the narrow-layout fallback.
- **Affected Callers/Consumers:** `features/links/commands.ts`, `keys.ts`, `SidePanelView`, `picker.ts` (`onSearchResults` for mentions)
- **Construction/Wiring:** None
- **Dependencies:** `note-index.ts`, `mentions.ts`, `link-edits.ts`, `picker.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `toggleSidePanel`, `sidePanelKey`, `sidePanelRows`, `requestMentions` | None — new symbol | as below | as above |

**Existing Shape:** None — new file or symbol

```ts
None
```

DI1 has only the explorer panel (`src/core/state/types.ts:82-91`).

**Proposed Shape:**

```ts
/** cols < 100 → open the "backlinks" or "headings" picker instead (M4 S18). Otherwise toggle the docked panel and focus it. */
export function toggleSidePanel(c: CommandContext, kind: "backlinks" | "outline"): Result;
export function requestMentions(s: AppState, path: string): Result;          // search{mode: "mentions", names: [basename, …aliases], exclude: path}
export type SidePanelRow = { section: "linked" | "unlinked" | "outline"; path?: string; line: number; text: string; hit?: MentionHit };
export function sidePanelRows(s: AppState): SidePanelRow[];                    // linked (backlinksOf) then unlinked (mentions.hits)
export function sidePanelKey(s: AppState, a: { key: Key; now: number }, reg: Registries): Result;   // j/k, Enter, l, q
```

The panel shows the active note. Changing the active buffer re-requests mentions. `l` on an unlinked row builds `linkMentionEdit` and calls `startMentionEdit`. After `editsApplied`, the index update moves the mention into `backlinksOf`, and a re-request removes it from the unlinked list. While the index is not ready, the rows come from the partial index and the view shows the indexing state.

- **Invariants:** Unlinked rows never include links, code, math, comments, or frontmatter (worker rule).
- **Verification Coverage:** S9 — V38; S18 — V43, V44

## `src/core/state/status.ts` and `src/ui/views/statusline.ts`

- **Change:** Modify
- **Decisions:** DES9
- **Requirements:** W261003FX70-REQ1@R1
- **Responsibilities:** the statusline segment data and painting for DI2 segments.
- **Affected Callers/Consumers:** `Statusline`
- **Construction/Wiring:** None
- **Dependencies:** `note-index.ts` (`backlinksOf`), `jumps.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `StatusSegments` | `src/core/state/status.ts:7-16` | adds `backlinks?: number`, `index: "indexing" \| "ready" \| "unavailable" \| undefined`, `indexProgress?`, `jump?: string` | `Statusline` |
| `statusSegments` | `:32-48` | fills backlinks (notes only, hidden while indexing), the index segment, and the jump segment | — |
| `Statusline.renderSelf` | `src/ui/views/statusline.ts:52-…` | paints `← N backlinks`, `◌ indexing n/total` / `◆ index ready` / `✗ index unavailable`, `jump i/n` in the accepted order | — |

**Existing Shape:** `src/core/state/status.ts:37-47`

```ts
  const seg: StatusSegments = { mode, dirty: b.dirty, view: b.view, path: b.path, position: w.content.cursor };
  if (b.fileType === markdownFileType.id) seg.words = countWords(b.text);
  if (b.save.kind === "failed") seg.saveError = { reason: b.save.reason, retryAt: b.save.retryAt };
  return seg;
```

The DI1 segments cover mode, view, path, words, save failure, and position.

**Proposed Shape:**

```ts
  if (b.fileType === markdownFileType.id && s.index.status !== "indexing") seg.backlinks = backlinksOf(s.index.ix, b.path).length;
  seg.index = s.index.status === "idle" ? undefined : s.index.status;
  if (s.index.status === "indexing") seg.indexProgress = { done: s.index.done, total: s.index.total };
  const jump = jumpSegment(s.jumps); if (jump !== undefined) seg.jump = jump;
```

The data stays a pure function, as the UI design's code shape requires (`rm261003abzp-ui-design.md:1189-1205`). The view follows the accepted order `MODE │ view │ path ● │ ← N backlinks │ W words │ preview │ index │ Ln:Col`, with the jump segment placed by the UI-design state "jump". Narrow layouts drop segments per that contract.

- **Invariants:** No backlinks or words segment for non-Markdown files.
- **Verification Coverage:** S18 — V30, V44

## `src/ui/overlays/{whichkey,picker,completion}.ts`, `src/ui/views/side-panel.ts`, `src/ui/overlays/prompt.ts`, `src/ui/views/window-tree.ts`, `src/ui/shell.ts`, `src/ui/theme.ts`

- **Change:** Add (whichkey, picker, completion, side-panel); Modify (prompt, window-tree, shell, theme)
- **Decisions:** DES7, DES9, DES6
- **Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ7@R1, W261003FX70-REQ9@R1
- **Responsibilities:** paint the DI2 overlays and panel from state; size the editor area next to the docked panel; read config live.
- **Affected Callers/Consumers:** `createShell`
- **Construction/Wiring:** `OverlayHost` gets the three new views (`src/ui/shell.ts:85-88`); `SidePanelView` joins `views` and the focus order
- **Dependencies:** `theme.ts`, `host.ts` (`drawFrame`, `centered`, `wrap`), `text-view.ts` (`paintPreview`, `paintLine`), core selectors (`whichKeyRows`, `sidePanelRows`, `pickerSources[id].title`)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `WhichKeyView`, `PickerView`, `CompletionView`, `SidePanelView` | None — new symbol | `View` implementations | `createShell` |
| `PromptView` | `src/ui/overlays/prompt.ts` | paints `prompt.impact` (warn token) and `prompt.invalid` (error token) lines | — |
| `WindowTree.update` | `src/ui/views/window-tree.ts` | reserves the right column for a docked side panel when open and `cols ≥ 100` | — |
| `createShell` | `src/ui/shell.ts:77-125` | registers the views; `createKeyNormalizer` gets `escTimeoutMs: () => store.get().config.escTimeoutMs` | — |
| `createKeyNormalizer` | `src/ui/input.ts:59-…` — `escTimeoutMs: number` | `escTimeoutMs: number \| (() => number)` read per Esc | `createShell`, input tests |
| `themeOf` | `src/ui/theme.ts:205-206` | `color: s.config.color === "never" ? "nocolor" : s.terminal.color` | all views |

**Existing Shape:** `src/ui/shell.ts:85-88`, `:113-114`

```ts
      const overlays = new OverlayHost(renderer, [
        new PromptView(renderer),
        new ConflictView(renderer),
      ]);
      // …
      const normalizer = createKeyNormalizer({
        escTimeoutMs: store.get().config.escTimeoutMs,
```

DI1 has two overlay views, and reads `escTimeoutMs` once at attach, so a config applied later (including reload) would not take effect.

**Proposed Shape:**

```ts
      const overlays = new OverlayHost(renderer, [
        new PromptView(renderer), new ConflictView(renderer),
        new WhichKeyView(renderer, ctx), new PickerView(renderer, ctx), new CompletionView(renderer, ctx),
      ]);
      const side = new SidePanelView(renderer, ctx);
      // views: […, windows, explorer, side, statusline, …]; focus: [overlays, cmdline, explorer, side, windows]
      const normalizer = createKeyNormalizer({ escTimeoutMs: () => store.get().config.escTimeoutMs, /* … */ });
```

The views paint state and never decide behaviour, as the UI design's implementation boundaries require ("must not own: search execution, keymap resolution"). `PickerView` calls `paintPreview` for file previews, and paints command and help previews as text. The visual rules (60/40 split, 80% × 70% float, which-key columns, popup placement above when < 10 rows remain) are taken from the UI design and owned there.

- **Invariants:** At < 100 columns, no preview pane and no docked panel.
- **Verification Coverage:** S15 — V42; S18 — V43, V44, V45, V46; S13 — V39 (reload applies `escTimeoutMs` and theme)

## `src/app/main.ts`

- **Change:** Modify
- **Decisions:** DES4, DES7, DES8, DES9
- **Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ4@R1, W261003FX70-REQ7@R1, W261003FX70-REQ8@R1
- **Responsibilities:** composition root.
- **Affected Callers/Consumers:** `bin/so`, e2e tests
- **Construction/Wiring:** as in section 5, Construction and Wiring Flow
- **Dependencies:** all adapters and registrations above

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `registries` | `src/app/main.ts:78-87` — builds one `Keymap` | registers link commands; returns `bindings` and `groups` | `createUpdate`, `createShell` |
| `main` | `:123-217` | creates the logger and index host; dispatches `configLoaded` and `stateLoaded` before `shell.attach`; starts the index host and forwards watcher events after the first frame; passes `saveSession` to the lifecycle; logs startup | — |

**Existing Shape:** `src/app/main.ts:183-194`

```ts
  shell.attach(store);
  injectThrow(store);
  const lifecycle = installLifecycle({ store, shell, runner });
  deps.exit = lifecycle.exitNow;
  runner.run({ kind: "listDir", dir: "" });
  if (ws.file !== undefined) runner.run({ kind: "read", path: ws.file });
  // Watching and platform detection start after the first frame.
  setImmediate(() => {
    watchWorkspace(ws.root, ownOps, matcher, (event) =>
      store.dispatch({ type: "fileChanged", event }),
    );
```

DI1 attaches the shell, lists the root, and starts watching after the first frame.

**Proposed Shape:**

```ts
  const configFile = configPath(process.env, homedir());
  const text = readConfigTextSync(configFile);
  if (text !== undefined) store.dispatch({ type: "configLoaded", result: parseConfig(text), reload: false });
  const stateFile = statePath(process.env, homedir(), realpathSync(ws.root));
  store.dispatch({ type: "stateLoaded", state: parsePersisted(readStateFile(stateFile)), restore: ws.file === undefined });
  shell.attach(store);
  const lifecycle = installLifecycle({ store, shell, runner, saveSession: (s) => saveStateFileSync(stateFile, snapshotSession(s)) });
  // …
  setImmediate(() => {
    watchWorkspace(ws.root, ownOps, matcher, (event) => {
      store.dispatch({ type: "fileChanged", event });
      indexHost.notify(event);
    });
    indexHost.start(ws.root, []);
    logger.info("first frame", { ms: Math.round(performance.now()) });
    // trash and clipboard detection as DI1
  });
```

Startup gets two synchronous small reads before the first frame. The worker and watcher start after it, so the first frame stays independent of the workspace size (RM261003ABZP-V13@R1). The hidden-folder and `.gitignore` rules are evaluated in the worker by its own `createExclusionMatcher`, so `ignore` stays empty in DI2. The field is kept for protocol compatibility.

- **Invariants:** No workspace-wide work before the first frame.
- **Verification Coverage:** S5 — V49; S11 — V47; S13 — V39; S16 — V40

## `test/boundaries.test.ts`, `test/repo.test.ts`, `knip.json`, `package.json`, `.github/workflows/release.yml`

- **Change:** Modify
- **Decisions:** DES2, DES4, DES7
- **Requirements:** W261003FX70-REQ2@R1, W261003FX70-REQ4@R1
- **Responsibilities:** enforce dependency homes and the worker entrypoint; build the binary with the worker.
- **Affected Callers/Consumers:** `bun run check`, CI, release
- **Construction/Wiring:** None
- **Dependencies:** None

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `PACKAGE_HOMES` | None — new symbol | `{ "mdast-util-from-markdown": ["src/core/lang/markdown/"], …five Markdown packages, "yaml": ["src/core/lang/markdown/"], "toml-eslint-parser": ["src/core/config/"] }` | `checkImports` |
| `checkImports` | `test/boundaries.test.ts:62-85` | a package listed in `PACKAGE_HOMES` imported outside its homes is a violation | — |
| repo test "compile includes the worker" | None — new symbol | every `bun build --compile` in `package.json` scripts and workflow files lists `src/workspace/index-worker.ts` | — |
| `knip.json` `entry` | `knip.json` — scripts and tests | adds `src/workspace/index-worker.ts` | knip |
| `scripts.build` | `package.json` — `bun build --compile src/app/main.ts --outfile dist/so` | `bun build --compile src/app/main.ts src/workspace/index-worker.ts --outfile dist/so` | `bun run build`, V47 |
| release build step | `.github/workflows/release.yml:25-26` | both loops pass `src/workspace/index-worker.ts` after `src/app/main.ts` | release |

**Existing Shape:** `test/boundaries.test.ts:72-79`

```ts
    if (specifier.startsWith(".")) {
      const target = `${join(dirname(path), specifier)}/`;
      if (!rule.allow.some((prefix) => target.startsWith(prefix)))
        reason = `${rule.from} may import only ${rule.allow.join(", ")}`;
    } else {
      reason = packageViolation(specifier, rule.packages);
    }
```

DI1 enforces layer and package policies, but not per-package homes.

**Proposed Shape:**

```ts
const PACKAGE_HOMES: Readonly<Record<string, readonly string[]>> = {
  "mdast-util-from-markdown": ["src/core/lang/markdown/"], "micromark-extension-gfm": ["src/core/lang/markdown/"],
  "mdast-util-gfm": ["src/core/lang/markdown/"], "micromark-extension-math": ["src/core/lang/markdown/"],
  "mdast-util-math": ["src/core/lang/markdown/"], yaml: ["src/core/lang/markdown/"],
  "toml-eslint-parser": ["src/core/config/"],
};
    } else {
      const homes = PACKAGE_HOMES[specifier];
      reason = homes !== undefined && !homes.some((h) => path.startsWith(h))
        ? `${specifier} may be imported only from ${homes.join(", ")}`
        : packageViolation(specifier, rule.packages);
    }
```

The homes rule extends the existing check without changing layer rules. The worker file already falls under the `src/workspace/` rule (`test/boundaries.test.ts:23-27`), which matches the phase file (`…phase-1…md:112`). One new fixture imports `yaml` from `src/core/state/`.

- **Invariants:** The existing fixtures still report exactly one violation each.
- **Verification Coverage:** S19 — V35, V53, V55; S11 — V52, V56

## `scripts/bench-gate.ts`, `test/bench/*`, `test/fixtures/generate.ts`

- **Change:** Modify (bench-gate, generate); Add (benches)
- **Decisions:** DES10
- **Requirements:** W261003FX70-REQ1@R1, W261003FX70-REQ3@R1, W261003FX70-REQ4@R1
- **Responsibilities:** the 10,000-note fixture and the V13 benchmarks.
- **Affected Callers/Consumers:** `bun run bench` (Linux CI)
- **Construction/Wiring:** `BENCHES` registry
- **Dependencies:** `test/e2e/pty.ts`, `test/support/ui.ts`, `createIndexHost`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `TARGETS` | `scripts/bench-gate.ts:8` — `{ sourceKeystrokeP95: 16, openFile: 50 }` | adds `firstFrame: 200`, `indexReady: 3000`, `indexingKeystrokeP95: 16` | gate |
| `BENCHES` | `:10-13` | adds `test/bench/startup.bench.ts --metric firstFrame`, `test/bench/startup.bench.ts --metric indexReady`, and `test/bench/indexing-keystroke.bench.ts` | gate |
| `runOnce` | `scripts/bench-gate.ts:17-28` — `(file) => Promise<number>`; spawns `[execPath, file]` | splits the `BENCHES` entry on spaces and passes the arguments after the file name | `main` |
| `makeNoteWorkspace` | None — new symbol | `(dir, n = 10_000) => Promise<string>` — deterministic notes in nested folders with links, tags, headings, frontmatter, block ids, ~1 KB each | benches, V37 |

**Existing Shape:** `scripts/bench-gate.ts:7-13`

```ts
export const TARGETS = { sourceKeystrokeP95: 16, openFile: 50 } as const;
const BENCHES: Record<keyof typeof TARGETS, string> = {
  sourceKeystrokeP95: "test/bench/source-keystroke.bench.ts",
  openFile: "test/bench/open-file.bench.ts",
};
```

Each bench prints one `{metric, ms}` line, the median of five runs is taken, and the gate fails above 2× the target.

**Proposed Shape:**

```ts
export const TARGETS = { sourceKeystrokeP95: 16, openFile: 50, firstFrame: 200, indexReady: 3000, indexingKeystrokeP95: 16 } as const;
const BENCHES: Record<keyof typeof TARGETS, string> = {
  sourceKeystrokeP95: "test/bench/source-keystroke.bench.ts",
  openFile: "test/bench/open-file.bench.ts",
  firstFrame: "test/bench/startup.bench.ts --metric firstFrame",
  indexReady: "test/bench/startup.bench.ts --metric indexReady",
  indexingKeystrokeP95: "test/bench/indexing-keystroke.bench.ts",
};
```

`startup.bench.ts` generates the workspace once in a tmp directory, spawns `bun src/app/main.ts <ws>` in a PTY through `test/e2e/pty.ts`, and timestamps two screen events:

- the first statusline row, which gives `firstFrame`;
- `◆ index ready` in the statusline, which gives `indexReady`.

`indexing-keystroke.bench.ts` mounts the shell with a real `createIndexHost` on the generated workspace, types 200 keys while the status is `indexing`, and reports the p95. `runOnce` passes the argument after the file name.

The gate keeps the parent mechanism (fail above 2×). The PH1 exit evidence for RM261003ABZP-V13@R1 is that the recorded Linux CI medians in `.so-bench/results.json` stay below the targets themselves.

- **Invariants:** Benchmarks run only through `bun run bench`, never in `check`.
- **Verification Coverage:** S5 — V49, V50, V51

## Migration and Delivery

- **Database or Schema Migration:** None — no database. The state file is new at `"version": 1`, and unknown versions load as empty (`parsePersisted`; V32).
- **Data Backfill:** None — the index is rebuilt at every start and never persisted.
- **Mixed-Version Compatibility:** None — there is a single local process. Notes stay plain Obsidian files, and `.obsidian/` is never read or written.
- **Feature Flags:** None — DI2 ships in one PR before `v0.1.0`; no partial rollout exists.
- **Rollout Constraints:** One Work, one PR. CI must pass `check`, `test:ci` on both runners, and `bench` on Linux, including the DI1 suites (V48). Releases happen only at PH1 exit.
- **Rollback:** Revert the PR on `main` before `v0.1.0`. A state file written by DI2 is ignored by DI1 (it never reads one). A config file written for DI2 is ignored by DI1.

# 8. Testing and Verification

## Design Success Criteria

| ID | Observable Success Condition | Traceability |
|---|---|---|
| `S1` | The AppState, Action, Effect, Overlay, and TimerId additions compile with the exhaustive switch. Every new fallible effect answers with exactly one action. No DI3 or DI4 field exists. | REQ1; DES1 |
| `S2` | The scan extracts every syntax in RM261003ABZP-REQ4@R3 with exact source ranges and ignores code, math, comments, and HTML comments; frontmatter tags, aliases, and links are found. | REQ3; DES2 |
| `S3` | `parseDoc(buf, prev)` equals `parseDoc(buf)`, ids included; one-block edits re-scan only changed blocks; block ids survive edits to other blocks; buffers carry analysis for their current version. | REQ3; DES2 |
| `S4` | The scan level and the mdast level agree on links, tags, headings, and block ids over the corpus. | REQ3; DES2 |
| `S5` | Index ready < 3 s and first frame < 200 ms on 10,000 notes; typing during indexing p95 ≤ 16 ms; DI1 `openFile` and `sourceKeystrokeP95` gates hold with Markdown analysis. | REQ1, REQ3, REQ4; DES2, DES4, DES10 |
| `S6` | Resolution follows the documented order exactly (V5@R1), `linkText` round-trips through `resolveLink`, and the index's derived maps equal a full rebuild. | REQ1; DES3 |
| `S7` | Rename and move preserve kind, alias, and subpath, use the shortest unique form, and keep every resolved link on its file, including captured and outgoing links and folder moves. | REQ6; DES3, DES6 |
| `S8` | Open buffers are edited in memory as one undo step; closed files are written atomically only when every span matches; a failed file operation applies no edit; one toast reports the count and skipped paths. | REQ6; DES6 |
| `S9` | Link-mention edits only the mention span with the basename-equality form; unlinked mentions exclude links, code, math, comments, and frontmatter; the mention moves to Linked. | REQ6; DES3, DES4, DES6 |
| `S10` | Rename or move during indexing shows the refusal and changes nothing; with the index unavailable, the prompt warns and only the file changes. | REQ6; DES6 |
| `S11` | The compiled binary reaches index ready; every compile lists the worker; one crash restarts, a second shows `index unavailable` while editing works. | REQ4; DES4 |
| `S12` | Saved links, external changes, explorer operations, and link-edit writes reach the index without a rescan; current-note outline updates before saving. | REQ5; DES5 |
| `S13` | Config path rules, strict keys, and every error kind name `config.toml:<line>`; invalid files apply defaults (startup) or keep the current config (reload); leader, overrides, `escTimeoutMs`, and theme apply, including after `:ConfigReload`. | REQ2, REQ7; DES7 |
| `S14` | `SO_LOG=debug` creates `so.log` in the state directory with no note text; without it no log exists. | REQ7; DES7 |
| `S15` | Which-key appears only after 300 ms with direct actions first; palette, `:` completion, which-key, and help respect file-type scope and show overrides; note keys do nothing in `sync.ts` and named note commands show the notice. | REQ1; DES7, DES9 |
| `S16` | Jumps match Neovim for recorded motions and cross-file navigation with the `jump i/n` indicator; recents are MRU, deduped, capped; the session restores on folder start only; the state file is outside the workspace with mode `0600`, and corrupt files load empty. | REQ8; DES8 |
| `S17` | Fuzzy ranking follows the fzf constants and tie-breaks; grep is literal, smart-case, debounced 100 ms, capped at 1,000 with `1000+`, and stale results are dropped; previews appear only at ≥ 100 columns, centred on the target line. | REQ9; DES3, DES9 |
| `S18` | The accepted DI2 UI states render: completion popup placement and insertion, follow and create prompt, backlinks panel, rename and move impact, statusline index/backlinks/jump segments, picker selection under NO_COLOR, light theme, and 80×24. | REQ1; DES9 |
| `S19` | Every added package is exactly pinned, imported only from its home, and used (knip clean). | REQ2; DES2, DES7 |
| `S20` | DI1 suites V1@R1, V17@R1, V18@R1 and the boundary test still pass on the DI2 PR. | REQ1 |

## Test Suites and Cases

```text
src/ & test/
├── src/core/lang/markdown/blocks.test.ts [Unit]
│   Purpose: block splitting keeps structural blocks whole
│   SUT: splitBlocks
│   Infra: None
│   Doubles: None
│   └── V1 frontmatter, ``` and ~~~ fences (closed and unclosed), $$ math, %% comment, nested list, indented code
│       ├── Expect: spans cover every line once; each listed construct is one span of its kind; an unclosed fence ends at EOF [S2]
│       └── Unique risk: a link inside a fence counted because the fence was split
├── src/core/lang/markdown/scan.test.ts [Unit]
│   Purpose: scan facts and exclusions
│   SUT: scanBlock, scanFrontmatter, scanDoc
│   Infra: None
│   Doubles: None
│   ├── V2 one note containing every RM261003ABZP-REQ4@R3 syntax ([[note]], [[note|alias]], [[note#H]], [[note#H1#H2]], [[note#^id]], ![[embed]], [x](a%20b.md), #tag, #tag/sub, ## heading, ^block-id)
│   │   ├── Expect: links/tags/headings/blockIds equal the expected list with exact `range` that slices to `raw`; md target URL-decoded to "a b.md" [S2]
│   │   └── Unique risk: wrong spans make rename corrupt text
│   ├── V3 the same syntax inside `inline code`, ``` fence, indented code, $math$, $$ block, %%comment%%, <!-- html -->; "#123" and "a#tag"
│   │   ├── Expect: no links or tags; each construct appears in `excluded`; "#123" and "a#tag" are not tags [S2]
│   │   └── Unique risk: index and gd treating code as links
│   └── V4 frontmatter `tags: [a, b/c]`, `aliases: Plan`, `related: "[[plan]]"`
│       ├── Expect: tags ["a","b/c"], aliases ["Plan"], one link with inFrontmatter and exact range on the `related` line [S2]
│       └── Unique risk: frontmatter links missed by rename (V6@R2 (a))
├── src/core/lang/markdown/doc.test.ts [Unit]
│   Purpose: block cache transparency and incrementality
│   SUT: parseDoc
│   Infra: None
│   Doubles: None
│   ├── V5 random edit sequences over the corpus notes (seeded)
│   │   ├── Expect: parseDoc(buf, prev) deep-equals parseDoc(buf) after every edit [S3]
│   │   └── Unique risk: stale cached blocks diverging from text
│   ├── V6 edit one paragraph in a 200-block note
│   │   ├── Expect: 199 Block objects are reference-equal to the previous Doc's; only the edited block is re-scanned [S3]
│   │   └── Unique risk: whole-document re-scan per keystroke
│   └── V6a insert a paragraph above block k; force two distinct hashes to share an FNV value
│       ├── Expect: every pre-existing block keeps its id after the insert; the colliding pair gets distinct ids in document order and the same ids from parseDoc(buf) and parseDoc(buf, prev) [S3]
│       └── Unique risk: fold keys (DI3) moving to another block, or ids depending on edit history
├── src/core/lang/markdown/conformance.test.ts [Unit]
│   Purpose: one grammar at two levels
│   SUT: scanDoc vs blockNode
│   Infra: None
│   Doubles: None
│   └── V7 every file in test/fixtures/markdown-corpus/
│       ├── Expect: link targets, tags, headings, and block ids collected from mdast nodes equal the scan's, except the differences listed in the test (empty at design time) [S4]
│       └── Unique risk: scan and renderer disagreeing about what is a link
├── src/core/features/links/resolve.test.ts [Unit]
│   Purpose: resolution order and shortest form
│   SUT: resolveLink, linkText
│   Infra: None
│   Doubles: None
│   ├── V8 RM261003ABZP-V5@R1 scenario: a/plan.md, b/plan.md, plan-x.md (alias plan), c/deep/plan.md; [[plan]] from a/x.md and root.md, [[b/plan]], [[plan.md]], [[note#H1#H2]], [text](a/plan%20x.md)
│   │   ├── Expect: results equal the documented order exactly (a/plan.md from a/x.md; alias plan-x.md from root.md; b/plan.md; …) [S6]
│   │   └── Unique risk: nondeterministic or Obsidian-incompatible targets
│   └── V9 linkText for every file from every note in a generated workspace
│       ├── Expect: resolveLink(ix, from, linkText(ix, from, to)) is `to`; no shorter suffix resolves to `to` [S6]
│       └── Unique risk: written links resolving elsewhere
├── src/core/features/links/note-index.test.ts [Unit]
│   Purpose: incremental derived maps
│   SUT: applySummaries, removePaths, movePaths, addFiles, backlinksOf, tagCounts
│   Infra: None
│   Doubles: None
│   └── V10 random sequences of apply/remove/move/add over generated summaries (seeded)
│       ├── Expect: after every step, every derived map deep-equals a full rebuild from summaries and files [S6, S12]
│       └── Unique risk: incremental drift in backlinks after renames
├── src/core/features/links/rename.test.ts [Unit]
│   Purpose: the rename invariant and format preservation
│   SUT: planRename, renameImpact
│   Infra: None
│   Doubles: None
│   ├── V11 RM261003ABZP-V6@R2 (a): plan.md → projects/roadmap.md with [[plan]], [[plan|Plan]], ![[plan#Goals]], [x](plan.md), frontmatter related: "[[plan]]", open scan with [[plan]]
│   │   ├── Expect: edits produce [[roadmap]], [[roadmap|Plan]], ![[roadmap#Goals]], [x](projects/roadmap.md), related: "[[roadmap]]"; each edit's expected equals the old raw; the open path's edit comes from the open scan [S7]
│   │   └── Unique risk: lost alias/subpath/kind
│   ├── V12 property: 200 generated workspaces × random file/folder moves
│   │   ├── Expect: for every link resolved before, resolve after applying the plan equals the moved image of its old target; unresolved links unchanged; only link spans differ [S7]
│   │   └── Unique risk: broken links in unanticipated ambiguity cases
│   ├── V13 capture: move c/deep/plan.md → plan.md with root.md containing [[plan]] (→ a/plan.md)
│   │   ├── Expect: root.md's link rewritten to [[a/plan]] [S7]
│   │   └── Unique risk: the new name stealing other notes' links
│   └── V14 folder move notes/ → archive/notes/ with outgoing ambiguous links inside moved notes
│       ├── Expect: every contained file mapped; outgoing links whose same-folder ranking changes are rewritten; renameImpact counts links and files [S7]
│       └── Unique risk: folder moves breaking outgoing links
├── src/core/features/links/mentions.test.ts [Unit]
│   Purpose: the mention span edit
│   SUT: linkMentionEdit
│   Infra: None
│   Doubles: None
│   └── V15 mention "Plan" and "plan" of plan.md in notes/x.md
│       ├── Expect: "Plan" → [[plan|Plan]], "plan" → [[plan]]; one edit with expected = mention text; range unchanged [S9]
│       └── Unique risk: editing outside the mention or wrong alias form
├── src/core/kernel/text/fuzzy.test.ts [Unit]
│   Purpose: scoring constants and ranking
│   SUT: fuzzyScore, rankBy
│   Infra: None
│   Doubles: None
│   └── V16 "srd" over [areas/side-projects.md, projects/so-roadmap.md]; "back" over command ids; "Plan" vs "plan"; equal-score ties
│       ├── Expect: so-roadmap first; link.backlinks first; uppercase query is case-sensitive; ties → shorter, then alphabetical; SCORE equals fzf's constants [S17]
│       └── Unique risk: ranking regressions that break UV4 expectations
├── src/core/config/toml.test.ts [Unit]
│   Purpose: config parsing with lines
│   SUT: parseConfig
│   Infra: None
│   Doubles: None
│   ├── V17 syntax error on line 7 (`e = = 5`)
│   │   ├── Expect: { ok: false, errors: [{ line: 7, … }] } [S13]
│   │   └── Unique risk: V4 (c) without a line
│   ├── V18 unknown key `[editor] tabWidth = 4` at line 3; `autosave.delayMs = "x"` at line 5; `leader = "ab"`
│   │   ├── Expect: errors at lines 3, 5, and the leader line, in source order [S13]
│   │   └── Unique risk: unknown keys accepted silently, or reported without a line
│   └── V19 valid file with leader, escTimeoutMs, autosave, theme, color, [keys.normal], [filetypes.markdown.keys.normal]
│       ├── Expect: ok; config equals expected; bindings carry their lines [S13]
│       └── Unique risk: valid options rejected
├── src/core/state/config.test.ts [Unit]
│   Purpose: applying and validating config
│   SUT: onConfigLoaded, validateBindings
│   Infra: None
│   Doubles: None
│   └── V20 bindings to an unknown command id (line 4), unknown file type (line 6), unknown mode (line 8); startup vs reload; leader ","
│       ├── Expect: toast "config.toml:4: unknown command id … (+2 more)"; startup → defaults, reload → previous config kept; with a valid file and leader "," the keymap maps ",ff" to file.find; keymapFor returns the same object for the same config [S13]
│       └── Unique risk: a bad binding crashing startup or half-applying
├── src/core/state/whichkey.test.ts [Unit]
│   Purpose: which-key timing and rows
│   SUT: armWhichKey, onWhichKeyTimer, whichKeyKey, whichKeyRows
│   Infra: None
│   Doubles: None
│   └── V21 Space then timer at 300 ms; Space then f before the timer; `<BS>` and `<Esc>` in the overlay; Space q (unbound)
│       ├── Expect: overlay only after the timer with the prefix still pending; rows list direct actions before "+groups"; `<BS>` pops one key; unknown → overlay closed + "no mapping for <leader>q" [S15]
│       └── Unique risk: popup flicker or swallowed sequences
├── src/core/state/keys.test.ts [Unit] (modified)
│   Purpose: file-type scope and command-line execution
│   SUT: handleKeyAction, executeEx, cmdlineCompletions
│   Infra: None
│   Doubles: None
│   └── V22 note vs scripts/sync.ts: gd on [[plan]] / identifier; `:link.follow`; palette and `:` completion lists; `<leader>w` with global and markdown overrides (V4 (b), (f)–(i)); `:w` uses file.save
│       ├── Expect: note follows, sync.ts unchanged; `:link.follow` in sync.ts → "not available for typescript files"; no link.* in sync.ts lists; `<leader>w` → link.backlinks in the note, file.save in sync.ts; every linkBindings scope is markdown [S15]
│       └── Unique risk: note keys leaking into code files
├── src/core/state/links.test.ts [Unit]
│   Purpose: follow, create, and completion transitions
│   SUT: link.follow, maybeOpenCompletion, completionKey
│   Infra: None
│   Doubles: None
│   └── V23 gd on [[plan#Goals]], on [[missing]], off a link; Insert "[[pl", "#", Enter
│       ├── Expect: read effect for plan.md, jump pushed, cursor at "Goals" after fileLoaded; confirm prompt "Create projects/plan.md? [y/N]"; off-link no change; completion items notes → headings, Enter inserts "plan#Goals]]" in one undo block [S18]
│       └── Unique risk: following to the wrong position or breaking the Insert undo block
├── src/core/state/link-edits.test.ts [Unit]
│   Purpose: the edit pipeline as state transitions
│   SUT: startRename, promptImpact, submitRename, onFsResult, beginRewrite, onEditsApplied, applyBufferEdits
│   Infra: None
│   Doubles: None
│   └── V24 rename with index ready / indexing / unavailable; fsResult ok and failed; results ok, ok, skipped; open dirty buffer; stale open mention
│       ├── Expect: ready → prompt impact "31 links in 12 files", Enter disabled on an existing name; indexing → message "index not ready — try again when indexing finishes", no prompt; unavailable → warning impact and only the FsOp; failed fsResult → no edit effects and rewrite cleared; ok → open buffer edited in one undo step and dirty, one applyEdits per closed file after the FsOp; toasts "12 files updated" and "skipped: …"; stale mention → toast, no edit [S8, S10, S7]
│       └── Unique risk: edits emitted before the file operation or lost results
├── src/core/state/index.test.ts [Unit]
│   Purpose: main-thread freshness
│   SUT: onIndexBatch, summarizeSaved, indexAfterFsOp, indexAfterFileEvent, onEditsApplied
│   Infra: None
│   Doubles: None
│   └── V25 save a.md with a new link; create/rename/move/trash via fsResult; editsApplied with text; fileChanged removed; add "## New" in the current note
│       ├── Expect: b.md backlinks include a.md after saved (no worker); files and backlinks follow each FsOp; edited file summary updated; removed path gone; outline rows include "New" before any save; status indexing → ready → unavailable transitions [S12]
│       └── Unique risk: index blind to so's own changes
├── src/core/state/jumps.test.ts [Unit]
│   Purpose: jump list rules
│   SUT: pushJump, jumpBack, jumpForward, jumpSegment, touchRecent
│   Infra: None
│   Doubles: None
│   └── V26 105 pushes; same-line push; push from the middle; back at end; recent with duplicates and 101 paths
│       ├── Expect: length 100; same-line entry replaced; forward history truncated; back at end records current; segment "jump i/n"; recent MRU, deduped, length 100 [S16]
│       └── Unique risk: unbounded growth or Neovim-divergent history
├── test/vim/vim.test.ts [Unit] (cases added, recorded from Neovim 0.11)
│   Purpose: in-buffer jumps equal Neovim
│   SUT: handleKey through update
│   Infra: None
│   Doubles: None
│   └── V27 cases "G<C-o>", "gg<C-o><C-i>", "/two<CR><C-o>", "nN<C-o><C-o>", "}<C-o>", "dG<C-o>"
│       ├── Expect: text, cursor, and mode equal the recorded Neovim results [S16]
│       └── Unique risk: Ctrl-o diverging from Neovim
├── src/core/state/session.test.ts [Unit]
│   Purpose: snapshot, restore, debounce
│   SUT: snapshotSession, parsePersisted, onStateLoaded, sessionChanged, update (saveState timer)
│   Infra: None
│   Doubles: None
│   └── V28 two splits with files; restore true/false; one restored file refused; version 2 and garbage JSON; a cursor-only change vs opening a file
│       ├── Expect: snapshot has no text; restore → two reads and windows filled on fileLoaded; restore false → only recents and jumps; one toast "1 files from the last session were not found"; invalid → undefined; opening a file appends startTimer saveState 2000, cursor-only does not [S16]
│       └── Unique risk: restoring into the wrong window or persisting text
├── src/core/state/picker.test.ts [Unit]
│   Purpose: picker state machine
│   SUT: openPicker, pickerKey, onSearchTimer, onSearchResults, onPreviewLoaded
│   Infra: None
│   Doubles: None
│   └── V29 grep typing "a","ab" then timers; results for an old id; 1,000 hits with capped; empty query; cols 99 vs 120 selection; recent with a removed file
│       ├── Expect: one search per settled query with the newest id; old-id results dropped; counter "1000+"; empty query → no effect; readPreview only at 120 cols; recent hides the removed file [S17, S16]
│       └── Unique risk: stale results or previews flashing
├── src/core/state/status.test.ts [Unit] (modified)
│   Purpose: segment data
│   SUT: statusSegments
│   Infra: None
│   Doubles: None
│   └── V30 note vs sync.ts; index idle/indexing/ready/unavailable; after a jump
│       ├── Expect: backlinks only for notes and not while indexing; index segment values; jump "2/2" [S18]
│       └── Unique risk: note segments on code files
├── src/workspace/config-file.test.ts [Unit]
│   Purpose: XDG path rule
│   SUT: configPath, readConfigTextSync
│   Infra: filesystem (tmp)
│   Doubles: None
│   └── V31 XDG_CONFIG_HOME unset, "", "relative/path", "/abs"; missing file
│       ├── Expect: ~/.config/so/config.toml for the first three (V4 (d)); /abs/so/config.toml; missing → undefined [S13]
│       └── Unique risk: config read from a relative path
├── src/workspace/state-file.test.ts [Unit]
│   Purpose: state file location and safety
│   SUT: statePath, readStateFile, saveStateFile
│   Infra: filesystem (tmp)
│   Doubles: None
│   └── V32 XDG_STATE_HOME variants; workspace inside the state dir parent; save then stat; corrupt file
│       ├── Expect: path = <state>/so/<16 hex>/state.json and never under the workspace root; file mode 0600; corrupt JSON → undefined [S16]
│       └── Unique risk: state written into the workspace or world-readable
├── src/workspace/log.test.ts [Unit]
│   Purpose: log gating
│   SUT: createLogger
│   Infra: filesystem (tmp)
│   Doubles: None
│   └── V33 SO_LOG unset vs debug
│       ├── Expect: unset → no file after info/error; debug → $XDG_STATE_HOME/so/so.log with JSON lines [S14]
│       └── Unique risk: log written when not requested
├── src/workspace/index-worker.test.ts [Integration]
│   Purpose: the worker's scan and search in a real thread
│   Real: Bun Worker running index-worker.ts, readTextFile, createExclusionMatcher
│   Infra: filesystem (tmp workspace with .hidden/, node_modules/, .gitignore, photo.png, big.log 17 MiB, notes)
│   Doubles: None
│   └── V34 scan; search "TODO" text; search with limit 2; mentions of "Plan" with links, code, frontmatter occurrences
│       ├── Expect: files exclude hidden, node_modules, and ignored paths; summaries only for .md; text hits include a .ts file, never photo.png or big.log; limit → 2 hits capped true; mentions only plain-prose occurrences; the workspace listing and mtimes are unchanged afterwards [S9, S17]
│       └── Unique risk: search reading binary files or the worker writing
├── test/boundaries.test.ts [Unit] (modified)
│   Purpose: layer and package homes
│   SUT: checkImports
│   Infra: None
│   Doubles: None
│   └── V35 src scan; fixture importing yaml from src/core/state/
│       ├── Expect: no violations in src; the fixture reports exactly one; existing fixtures still one each [S19, S20]
│       └── Unique risk: Markdown or TOML packages spreading through core
├── test/integration/index-host.test.ts [Integration]
│   Purpose: worker lifecycle and freshness through the real host
│   Real: createIndexHost, worker, createStore with createUpdate, createEffectRunner, watchWorkspace
│   Infra: filesystem (tmp workspace)
│   Doubles: spawn wrapper that injects crashes by terminating the worker
│   ├── V36 crash once; crash twice; edit a buffer after the second crash
│   │   ├── Expect: first crash → rescan to ready; second → status unavailable and statusline segment "unavailable"; editing and saving still work [S11]
│   │   └── Unique risk: a crashing worker taking editing down
│   └── V37 another process appends [[a]] to b.md; so saves a link in c.md
│       ├── Expect: backlinksOf(a.md) includes b.md after the watcher event and c.md after saved [S12]
│       └── Unique risk: external or own changes missing from backlinks
├── test/integration/rename.test.ts [Integration]
│   Purpose: rename and link-mention end to end on disk
│   Real: store, reducer, effect runner, atomicWrite, OwnOps, watcher
│   Infra: filesystem (tmp workspace)
│   Doubles: None
│   └── V38 RM261003ABZP-V6@R2 (a) and (b); one closed referencing file modified on disk after indexing; mention in an open dirty buffer and in a closed file
│       ├── Expect: closed files rewritten atomically as V11; the open dirty buffer edited in memory, dirty, its disk content unchanged until autosave; the modified file skipped, content byte-identical, listed in the toast; toast "N files updated"; mention edits as V15, closed one written through atomicWrite, and it moves to Linked [S7, S8, S9]
│       └── Unique risk: clobbered unsaved edits or overwritten concurrent changes
├── test/integration/config.test.ts [Integration]
│   Purpose: config file through startup, reload, and theme/esc wiring
│   Real: configPath, readConfigText, parseConfig, store, runner, shell normalizer
│   Infra: filesystem (tmp XDG dirs)
│   Doubles: None
│   └── V39 RM261003ABZP-V4@R2 (b), (c), (f); edit the file and :ConfigReload; then an invalid edit and :ConfigReload; escTimeoutMs and theme changed on reload
│       ├── Expect: `<leader>w` saves (b); toast names config.toml:7 and defaults apply (c); (f) per scope; reload applies the new binding, escTimeoutMs, and theme; invalid reload keeps the previous binding and shows the error [S13]
│       └── Unique risk: reload not reaching the keymap or input normalizer
├── test/integration/session.test.ts [Integration]
│   Purpose: session persistence across runs
│   Real: main-equivalent wiring with state-file, lifecycle shutdown
│   Infra: filesystem (tmp workspace and XDG_STATE_HOME)
│   Doubles: None
│   └── V40 run 1: open two files in splits, follow a link, quit; run 2 on the folder; run 3 with a file argument
│       ├── Expect: run 2 restores both windows, files, and cursors, and jump list; run 3 shows only the file but keeps recents; no new file inside the workspace [S16]
│       └── Unique risk: restore applying with an explicit file or writing into the workspace
├── test/integration/log.test.ts [Integration]
│   Purpose: no note content in the log
│   Real: main-equivalent wiring with SO_LOG=debug, worker, a rename, a config error
│   Infra: filesystem (tmp)
│   Doubles: None
│   └── V41 run with notes containing a unique sentinel line
│       ├── Expect: so.log exists and contains no sentinel line and no line of any note's text [S14]
│       └── Unique risk: private note content leaking into logs
├── test/ui/discovery.test.ts [Component]
│   Purpose: RM261003ABZP-UV4@R2 and the picker-preview limits
│   Real: OpenTUI test renderer, shell, store, reducer
│   Infra: None
│   Doubles: effects answered by the test harness (index batch and search results from fixture data)
│   └── V42 every UV4@R2 action and assertion; plus a grep hit preview at 120 cols and none at 99 cols; ●-marked override in palette and help
│       ├── Expect: all UV4@R2 assertions hold; preview pane centred on the hit line at 120; absent at 99 [S15, S17]
│       └── Unique risk: discoverability broken in paint or interaction while data is right
├── test/ui/links.test.ts [Component]
│   Purpose: RM261003ABZP-UV5@R1
│   Real: test renderer, shell, store, reducer
│   Infra: None
│   Doubles: effects answered by the harness
│   └── V43 every UV5@R1 action and assertion (31 links in 12 files fixture)
│       ├── Expect: popup never on the cursor row, [[plan#Goals]] inserted, jump 2/2 → 1/2, create prompt text, Linked before Unlinked, mention moves after l, impact before Enter and "12 files updated" after [S18]
│       └── Unique risk: impact shown only after the irreversible action
├── test/ui/shell.golden.test.ts [Component] (modified)
│   Purpose: RM261003ABZP-UV1@R2 DI2 states
│   Real: test renderer
│   Infra: None
│   Doubles: fixed clock
│   └── V44 indexing 4,210/10,000; index-ready toast; outline and backlinks panel; sync.ts statusline at 120 cols
│       ├── Expect: goldens match; segment order includes backlinks and index; sync.ts row "MODE │ source │ scripts/sync.ts │ index │ Ln:Col" (preview segment arrives with DI3) [S18]
│       └── Unique risk: segment order or panel layout regressing silently
├── test/ui/file-ops.test.ts [Component] (modified)
│   Purpose: RM261003ABZP-UV6@R2 move with link impact
│   Real: test renderer
│   Infra: None
│   Doubles: effects at the boundary
│   └── V45 explorer m on a note referenced by 3 links in 2 files
│       ├── Expect: prompt shows "3 links in 2 files will be updated" before Enter [S18]
│       └── Unique risk: move without visible link impact
├── test/ui/theme.golden.test.ts [Component] (modified or added state)
│   Purpose: RM261003ABZP-UV10@R1 picker selection
│   Real: test renderer, NO_COLOR, light theme, 80×24
│   Infra: None
│   Doubles: None
│   └── V46 picker open with a selection
│       ├── Expect: no colour SGR under NO_COLOR; selection distinguishable by ▸ and reverse; title and counter unclipped at 80×24; light golden matches [S18]
│       └── Unique risk: selection visible only by colour
├── test/e2e/binary-index.test.ts [E2E]
│   Purpose: the compiled binary runs its worker
│   Real: `bun run build` output dist/so in a PTY
│   Infra: filesystem (tmp workspace), PTY
│   Doubles: None
│   └── V47 start dist/so on a 50-note workspace on ubuntu-24.04 and macos-15
│       ├── Expect: statusline shows "index ready" within 10 s [S11]
│       └── Unique risk: release binaries silently missing the worker
├── DI1 suites (unchanged) [Integration, E2E]
│   └── V48 test/integration/{save-safety,open-save,explorer-ops}.test.ts, test/e2e/{restore,quit}.test.ts, test/ui/file-ops.test.ts refused cases
│       ├── Expect: RM261003ABZP-V1@R1, V17@R1, V18@R1 pass on the DI2 PR in both CI runners [S20]
│       └── Unique risk: DI2 regressing save safety, restore, or the open policy
├── test/bench/startup.bench.ts [Bench]
│   └── V49 generated 10,000-note workspace, real process in a PTY
│       ├── Expect: median firstFrame < 200 ms and indexReady < 3,000 ms recorded on Linux CI; gate fails above 2× [S5]
│       └── Unique risk: indexing or startup regressions
├── test/bench/indexing-keystroke.bench.ts [Bench]
│   └── V50 200 keys typed while status is indexing, real worker
│       ├── Expect: p95 ≤ 16 ms recorded; gate fails above 2× [S5]
│       └── Unique risk: batches blocking input
├── test/bench/{open-file,source-keystroke}.bench.ts [Bench] (unchanged files, now with Markdown analysis)
│   └── V51 the 5,000-line note and TypeScript file
│       ├── Expect: openFile median ≤ 100 ms and sourceKeystrokeP95 ≤ 32 ms (gate) with parseDoc active [S5, S3]
│       └── Unique risk: analysis cost landing on open or keystroke
└── Non-test verification
    ├── V52 Type/build check
    │   ├── Expect: `bun --bun run tsc --noEmit -p .` passes with the exhaustive update switch; `bun run build` compiles both entrypoints [S1, S11]
    │   └── Unique risk: unhandled actions or a broken binary build
    ├── V53 knip
    │   ├── Expect: zero findings with the worker as an entry and every added package used [S19]
    │   └── Unique risk: unused dependencies or an unreferenced worker file
    ├── V54 Obsolete-reference check
    │   ├── Expect: no `Bun.TOML`, no `ft.analyze(`/`analyses` in src/ui, no `"buffer.write"`, no `"<leader>": " "` entry, in src or test [S3, S13]
    │   └── Unique risk: dead parallel paths kept alive
    ├── V55 Pins (test/repo.test.ts, existing) and CI frozen lockfile
    │   ├── Expect: every package exact; `bun install --frozen-lockfile` passes [S19]
    │   └── Unique risk: version drift
    ├── V56 test/repo.test.ts "compile includes the worker"
    │   ├── Expect: every `bun build --compile` in package.json and .github/workflows lists src/workspace/index-worker.ts [S11]
    │   └── Unique risk: one release target built without the worker
    ├── Migration: V32 (state version handling); no other migration — None
    ├── Configuration: V31, V39
    └── Observability: V33, V41
```

## Coverage Balance

- Pure rules (scan, resolution, rename planning, ranking, config parsing, jumps, session, picker state) are proven at the unit level with seeded property tests where the input space is large (V5, V9, V10, V12).
- Integration cases cover only real collaboration risks: the worker thread (V34, V36), disk validation and atomic writes (V38), config file wiring (V39), cross-run persistence (V40), and log content (V41).
- Component cases assert only the UI verification records' presentation and interaction risks (V42–V46). They reuse state-level behaviour proven by unit tests instead of re-testing it.
- Each binary-only and performance risk has one dedicated check (V47, V49–V51, V56).
- DI1 suites are re-run, not duplicated (V48).

## Test Quality Rules

- **Unit:** Verify one public behavior or invariant per case; keep it deterministic and isolated; use doubles only at true boundaries; assert outputs or meaningful side effects. Do not test private methods, mock every collaborator, duplicate implementation logic, or assert internal call order unless order is contractual. Property tests use fixed seeds and print the seed on failure.
- **Integration/Contract:** Verify real collaboration, wiring, or boundary behavior; keep the components under examination real and list any actual database, queue, cache, filesystem, or external service under `Infra`. Replace only slow or external dependencies when necessary and list them under `Doubles`. Each test uses its own tmp workspace and XDG directories, and cleans them up.
- **Non-test:** type/build (V52), knip (V53), obsolete references (V54), pins (V55), and the worker entrypoint (V56) run in `bun run check` (V52–V56 except the binary build in V47). Migration, configuration, and observability are covered by V32, V31/V39, and V33/V41.

# 9. Finalized Design Decisions

## W261003FX70-DES1: State, action, and effect protocol additions

**Question:** How does DI2 extend AppState and the one-way protocol without breaking DI1 or anticipating DI3 and DI4?

**Decision:** Add exactly the phase-file DI2 fields and variants, plus the reported additive variants `indexFailed`, `editsApplied`, `previewLoaded`, `loadConfig`, `applyEdits`, `readPreview`, the timers `whichKey`, `saveState`, `search`, and the sub-fields `windows.restore`, `PromptState.impact`, `PromptState.invalid`. Logging is not an effect: adapters log directly.

**Requirements Addressed:** W261003FX70-REQ1@R1, W261003FX70-REQ5@R1, W261003FX70-REQ6@R1, W261003FX70-REQ8@R1, W261003FX70-REQ9@R1

**Research Support:** None

**Rationale:** Each new asynchronous result needs exactly one action, so `update` stays pure (RM261003ABZP-DES2@R2). Logging as an effect would put an I/O request on every reducer path for a debug feature.

**Code Impact:**

- `src/core/state/types.ts` — `AppState`, `Action`, `Effect`, `Overlay`, `TimerId`, new state types — union and field additions
- `src/core/state/update.ts` — `Registries`, `createUpdate`, `onTimerAction` — new cases and timer routing
- `src/core/state/init.ts` — `initialState` — initial values for the new fields

**Detailed Design:** section 7, `src/core/state/types.ts`, `src/core/state/update.ts`

**Tradeoffs:**

- Three extra Actions and Effects beyond the phase list need parent synchronization; rejected folding them into existing variants (for example, reusing `saved` for link edits), which would mix save-state semantics.

**Success Criteria:** S1

**Verification Impact:**

- V52 — the type check passes with the exhaustive switch.
- V24, V25, V29 — each new action's reducer behaves as specified.

## W261003FX70-DES2: Two-level Markdown model

**Question:** How does DI2 parse Markdown within the index and open budgets while delivering `parseDoc` and `syntaxExtensions`?

**Decision:** One `splitBlocks` feeds a linear `scanBlock` (whole document) and a lazy, hash-cached `blockNode` (mdast per block). `syntaxExtensions` defines each syntax once for both. `parseDoc(buf, prev)` reuses blocks by hash and is computed in `update` through `withAnalysis`; the UI no longer analyzes. `Block.id` is the FNV-1a value of the block hash, made unique in document order, so ids are deterministic and survive edits to other blocks.

**Requirements Addressed:** W261003FX70-REQ3@R1, W261003FX70-REQ2@R1, W261003FX70-REQ1@R1

**Research Support:** None (local measurements in the requirements' Discussion Evidence)

**Rationale:** A full mdast parse takes 11.8 s for 10,000 notes and ~350 ms for the 300 KB `openFile` fixture, against limits of 3 s and 100 ms. A linear scan takes 36 ms for 10,000 notes. Defining each syntax once removes grammar drift, and the conformance test proves it.

**Code Impact:**

- `src/core/lang/markdown/{blocks,syntax,scan,doc,mdast}.ts` — new model
- `src/core/lang/markdown/file-type.ts` — `markdownFileType.analyze`
- `src/core/state/buffers.ts` — `withAnalysis` in `setBuffer`
- `src/ui/editors/text-view.ts` — `analyses` removed; `rows` reads `b.analysis`

**Detailed Design:** section 7, `src/core/lang/markdown/*`, `src/core/state/buffers.ts`, `src/ui/editors/text-view.ts`

**Tradeoffs:**

- Two levels can disagree on edge cases; the conformance test makes any difference explicit.
- Rejected: several mdast workers (still too slow on CI runners), a different CommonMark parser (changes DES6 for DI3), and an unrelated index regex (two grammars).

**Success Criteria:** S2, S3, S4, S5

**Verification Impact:**

- V1–V6a — scan, cache, incrementality, and block-id stability.
- V7 — conformance.
- V49, V51 — budgets.

## W261003FX70-DES3: Links core

**Question:** Which pure modules implement summaries, the index, resolution, rename planning, mentions, link-at-cursor, link commands, and fuzzy ranking?

**Decision:**

- `features/links/{summarize,note-index,resolve,rename,mentions,link-at,commands}.ts` with an immutable `NoteIndex`.
- `planRename(ix, moves, open)` enforces the resolution invariant, without file reads.
- `linkText` is defined through `resolveLink`.
- `fuzzyScore` and `rankBy` follow fzf v1 in `kernel/text/fuzzy.ts`.

**Requirements Addressed:** W261003FX70-REQ1@R1, W261003FX70-REQ6@R1, W261003FX70-REQ9@R1

**Research Support:** None

**Rationale:** Pure planning keeps `update` testable and the main thread free of note reads. Defining the shortest form through the resolver guarantees round-trips. fzf's constants are the de facto standard for terminal pickers, and the fuzzy module is not link-specific, so it belongs in the kernel.

**Code Impact:**

- `src/core/features/links/*` — new modules
- `src/core/kernel/text/fuzzy.ts` — new module

**Detailed Design:** section 7, `src/core/features/links/*`, `src/core/kernel/text/fuzzy.ts`

**Tradeoffs:**

- `planRename` loses the parent's `read` callback; open buffers must pass live scans.
- Rejected a fuzzy library dependency.

**Success Criteria:** S6, S7, S9, S17

**Verification Impact:**

- V8–V16 — resolution, index, rename, mention, and fuzzy assertions as listed.

## W261003FX70-DES4: Index worker and host

**Question:** How is the index built off the main thread, shipped in the binary, and kept alive?

**Decision:**

- `src/workspace/index-worker.ts` implements the phase-file protocol plus optional fields.
- `src/app/index-host.ts` spawns it with `new URL(…, import.meta.url)` after the first frame, translates messages, forwards watcher events, and restarts once.
- Every compile lists the worker as a second entrypoint, enforced by a repo test and proven by a compiled-binary e2e test.

**Requirements Addressed:** W261003FX70-REQ4@R1, W261003FX70-REQ5@R1, W261003FX70-REQ6@R1, W261003FX70-REQ9@R1

**Research Support:** None (local experiment: a single-entrypoint binary drops the worker silently)

**Rationale:** One code path works from source and from the binary, and the release smoke cannot see a missing worker. The restart-once policy is from the phase file.

**Code Impact:**

- `src/workspace/index-worker.ts`, `src/app/index-host.ts` — new
- `package.json` `scripts.build`, `.github/workflows/release.yml`, `knip.json`, `test/repo.test.ts` — the worker entrypoint

**Detailed Design:** section 7, `src/workspace/index-worker.ts`, `src/app/index-host.ts`, and the build-tooling entry

**Tradeoffs:**

- The worker caches note texts ≤ 1 MiB (about 10 MB for 10,000 notes) to make searches fast.
- Rejected a Blob-URL inline worker and a main-thread index.

**Success Criteria:** S5, S11

**Verification Impact:**

- V34 — scan and search.
- V36 — restart policy.
- V47 — binary.
- V56 — entrypoint check.
- V49, V50 — budgets.

## W261003FX70-DES5: Index freshness on the main thread

**Question:** How does the index see `so`'s own changes, which the watcher suppresses?

**Decision:** `src/core/state/index.ts` updates the index from `saved` (clean buffers only, summarized from `analysis.scan`), successful `fsResult`, `editsApplied` (from the written text), and watcher `removed` and non-note `changed` events. Note changes by other programs go to the worker. Current-note features read the live scan.

**Requirements Addressed:** W261003FX70-REQ5@R1

**Research Support:** None

**Rationale:** Summarizing one saved file from its existing scan costs nothing extra, and keeps the worker the only reader of closed files. The runner returns the written text, so the main thread never reads files.

**Code Impact:**

- `src/core/state/index.ts` — new
- `src/core/state/{save,explorer,disk}.ts` — one call each

**Detailed Design:** section 7, `src/core/state/index.ts`

**Tradeoffs:** Unsaved edits reach backlinks only after the next save (about 1 s with autosave).

**Success Criteria:** S12

**Verification Impact:**

- V25 — state transitions.
- V37 — end to end.

## W261003FX70-DES6: Link-safe edit pipeline

**Question:** How are rename, move, and link-mention edits applied safely?

**Decision:**

1. Gate on index readiness.
2. Show the impact in the prompt, recomputed per keystroke.
3. Run the file operation first.
4. On success, edit open buffers in memory as one undo step, and emit one `applyEdits` per closed file.
5. The runner re-validates every span on the serial queue, writes atomically as an own write, and reports `editsApplied`.
6. One toast aggregates the results.

**Requirements Addressed:** W261003FX70-REQ6@R1

**Research Support:** None

**Rationale:** Expected-text validation makes stale summaries safe. Ordering after the file operation avoids edits for failed operations. The serial queue and `follow` keep writes ordered behind moves (`src/app/effects.ts:47-62`).

**Code Impact:**

- `src/core/state/link-edits.ts` — new
- `src/core/state/explorer.ts` — `startOp`, `promptKey`, `submit`, `onFsResult`
- `src/core/state/buffers.ts` — `applyBufferEdits`
- `src/app/effects.ts` — `applyEdits`
- `src/ui/overlays/prompt.ts` — impact and invalid lines

**Detailed Design:** section 7, `src/core/state/link-edits.ts`, `src/app/effects.ts`

**Tradeoffs:**

- There is no revert on partial failure (phase file `:171`); skipped files are listed.
- Rename during indexing is refused rather than queued.

**Success Criteria:** S7, S8, S9, S10

**Verification Impact:**

- V24 — state rules.
- V38 — disk behaviour.
- V43, V45 — prompts.

## W261003FX70-DES7: Configuration

**Question:** How are config loading, errors with lines, keymap overrides, the leader, reload, and the debug log built?

**Decision:**

- **Loading:** `configPath` (XDG), a strict zod `ConfigSchema`, and `parseConfig` built on `toml-eslint-parser` with AST lines.
- **Applying:** `onConfigLoaded` with binding validation.
- **Keymap:** `keymapFor(reg, config)` memoized per config; the kernel `Keymap` takes the leader; `:ConfigReload` emits `loadConfig`.
- **Live settings:** the shell reads `escTimeoutMs` per key; `themeOf` honours `color = "never"`.
- **Log:** `SO_LOG=debug` uses `createLogger`.

**Requirements Addressed:** W261003FX70-REQ7@R1, W261003FX70-REQ2@R1, W261003FX70-REQ1@R1

**Research Support:** None (local experiment: `Bun.TOML.parse` gives no TOML line)

**Rationale:** Line-precise errors for every kind need source positions, and the AST parser gives them without a hand-written locator. Deriving the keymap from state makes reload a single action.

**Code Impact:**

- `src/core/config/{schema,toml}.ts`; `src/core/state/{config,keymap}.ts`
- `src/core/kernel/commands/keymap.ts`, `src/core/kernel/vim/keys.ts`
- `src/workspace/{config-file,log}.ts`; `src/ui/{shell,theme,input}.ts`; `src/app/main.ts`

**Detailed Design:** section 7, the files above

**Tradeoffs:**

- `editor.*`, `preview.*`, and `daily.*` are errors until assigned.
- The parent names `Bun.TOML.parse`, so the parser change is a reported deviation.

**Success Criteria:** S13, S14, S15

**Verification Impact:**

- V17–V20 — parse and apply.
- V31 — path.
- V39 — wiring.
- V33, V41 — log.

## W261003FX70-DES8: Navigation state and session

**Question:** How are jumps, recents, and session restore implemented with Neovim semantics?

**Decision:**

- **Jump signals:** the engine emits `jumped` for `G gg n N * # % { }` and search commits.
- **Jump list:** `pushJump`, `jumpBack`, and `jumpForward` implement Neovim's list (cap 100).
- **Recents:** `touchRecent` keeps an MRU list capped at 100.
- **Session file:** `snapshotSession` and `onStateLoaded` restore the layout only when `so` starts on a folder. The `state-file.ts` adapter writes `0600` at the hashed XDG state path, debounced by a 2 s `saveState` timer, and also on every shutdown through `installLifecycle`.
- **Oracle:** Neovim-recorded cases cover in-buffer jumps.

**Requirements Addressed:** W261003FX70-REQ8@R1

**Research Support:** None

**Rationale:** Signalling from the engine keeps the kernel language-neutral and the list in state. The recorder gives equality evidence, and saving on shutdown covers `:q`.

**Code Impact:**

- `src/core/kernel/vim/{types,engine}.ts`
- `src/core/state/{jumps,recent,session}.ts`
- `src/workspace/state-file.ts`; `src/app/{main,lifecycle}.ts`
- `test/vim/{cases.ts,expected.json}`

**Detailed Design:** section 7, the files above

**Tradeoffs:** A cursor-only change does not schedule a save; the shutdown save captures it.

**Success Criteria:** S16

**Verification Impact:**

- V26–V28, V32 — rules.
- V40 — across runs.

## W261003FX70-DES9: Discovery and link UI

**Question:** How are which-key, pickers, palette, help, completion, the side panel, and the new statusline segments structured between core and UI?

**Decision:**

- **Core:** pure reducers own all behaviour — `whichkey.ts` (300 ms timer, rows), `picker.ts` (`PickerSource` registry, fuzzy ranking, debounced grep with ids, previews only at ≥ 100 columns), `completion.ts`, `side-panel.ts` (narrow fallback to pickers), and the segment data in `status.ts`.
- **UI:** OpenTUI views paint state (`WhichKeyView`, `PickerView` with `paintPreview`, `CompletionView`, `SidePanelView`, `Statusline`, `PromptView`).
- **Keys:** note keys live only in `linkBindings` with the `markdown` scope, and `executeEx` runs typed command ids.

**Requirements Addressed:** W261003FX70-REQ1@R1, W261003FX70-REQ9@R1

**Research Support:** None

**Rationale:** Keeping behaviour in the reducer makes UV4 and UV5 interactions provable at the state level and leaves views thin, as the UI design's implementation boundaries require. Registration keeps new pickers additive (RM261003ABZP-REQ11@R3).

**Code Impact:**

- `src/core/state/{whichkey,picker,completion,side-panel,status,keys,commands}.ts`
- `src/core/features/links/commands.ts`, `src/core/kernel/commands/defaults.ts`
- `src/ui/overlays/{whichkey,picker,completion,prompt}.ts`, `src/ui/views/{side-panel,statusline,window-tree}.ts`, `src/ui/shell.ts`, `src/ui/editors/text-view.ts`

**Detailed Design:** section 7, the files above

**Tradeoffs:**

- Off a link, `Enter` in a note does nothing instead of Vim's line-down motion, because a binding owns the key.
- `PickerSource` lives in core rather than in `src/ui/overlays/picker.ts` as the UI design's illustrative shape shows; the contract is the same.

**Success Criteria:** S15, S17, S18

**Verification Impact:**

- V21–V23, V29, V30 — state level.
- V42–V46 — UV4, UV5, UV1, UV6, UV10.

## W261003FX70-DES10: Benchmarks and CI

**Question:** How is RM261003ABZP-V13@R1 measured, and how do CI and the bench gate change?

**Decision:**

- `makeNoteWorkspace` generates 10,000 deterministic notes.
- `startup.bench.ts` measures `firstFrame` and `indexReady` from the real process in a PTY; `indexing-keystroke.bench.ts` measures p95 with the real worker.
- `TARGETS` adds `firstFrame: 200`, `indexReady: 3000`, and `indexingKeystrokeP95: 16`. The gate keeps the parent's 2× rule, and the PH1 exit evidence requires the recorded medians below the targets.
- CI workflow files are unchanged. The compiled-binary test runs inside `test:ci`.

**Requirements Addressed:** W261003FX70-REQ1@R1, W261003FX70-REQ3@R1, W261003FX70-REQ4@R1

**Research Support:** None

**Rationale:** Measuring through the PTY observes what the user sees. Reusing the bench gate keeps one mechanism (RM261003ABZP-DES16@R1).

**Code Impact:**

- `scripts/bench-gate.ts` — `TARGETS`, `BENCHES`, argument passing
- `test/bench/{startup,indexing-keystroke}.bench.ts` — new
- `test/fixtures/generate.ts` — `makeNoteWorkspace`

**Detailed Design:** section 7, `scripts/bench-gate.ts`, `test/bench/*`, `test/fixtures/generate.ts`

**Tradeoffs:** The 2× gate tolerates CI noise but cannot by itself prove the 3 s target, so the exit evidence reads the recorded medians.

**Success Criteria:** S5

**Verification Impact:**

- V49, V50, V51 — the medians are recorded in `.so-bench/results.json`, and the gate passes.
