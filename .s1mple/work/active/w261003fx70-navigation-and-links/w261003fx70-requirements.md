# W261003FX70: Navigation and links — Requirements

**Document Status:** Ready for System Design

**Context Source:** `w261003fx70-discuss-context.md`

**Research Source:** None

**Unresolved Items:** None

**Ready for System Design Checklist:**

- [x] Every active topic is covered.
- [x] Every current requirement has a stable, unique ID and exact current revision.
- [x] Every current requirement includes its question, answer, rationale, acceptance criteria, and dependencies.
- [x] Scope, constraints, assumptions, risks, and compatibility boundaries are explicit.
- [x] For roadmap-linked work, the accepted parent baseline has been checked, assigned scope is covered by current requirements, and gates due before requirements approval have evidence; unresolved parent impacts prevent readiness.
- [x] Revised and replaced requirements preserve append-only lineage and complete prior revisions.
- [x] When research exists, every RF-to-evaluated-revision relationship has one reconciliation outcome; a finding that evaluated no requirement has one `None` relationship row.
- [x] Deferred decisions are outside the current-requirements ledger.
- [x] `Unresolved Items` is `None`.

**Approval evidence:** Self-drive of this discussion approved by the user on 2026-10-03. Under that delegation the agent aligned the overview (topics T1–T5), decided each requirement below by choosing the stable, simple, standards-based option, and skipped external research because local experiments settled the open technical questions (Discussion Evidence below).

# Table of Contents

1. [Problem and Desired Outcome](#1-problem-and-desired-outcome)
2. [Current and Expected State](#2-current-and-expected-state)
3. [Scope](#3-scope)
4. [Standards and Constraints](#4-standards-and-constraints)
5. [Current Requirements](#5-current-requirements)
   - [W261003FX70-REQ1@R1: Inherited DI2 obligations](#w261003fx70-req1r1-inherited-di2-obligations)
   - [W261003FX70-REQ2@R1: Added dependencies and pins](#w261003fx70-req2r1-added-dependencies-and-pins)
   - [W261003FX70-REQ3@R1: Two-level Markdown model within the performance budgets](#w261003fx70-req3r1-two-level-markdown-model-within-the-performance-budgets)
   - [W261003FX70-REQ4@R1: Index worker packaging and lifecycle](#w261003fx70-req4r1-index-worker-packaging-and-lifecycle)
   - [W261003FX70-REQ5@R1: Index freshness](#w261003fx70-req5r1-index-freshness)
   - [W261003FX70-REQ6@R1: Link-safe rename, move, and link-mention edits](#w261003fx70-req6r1-link-safe-rename-move-and-link-mention-edits)
   - [W261003FX70-REQ7@R1: Configuration file, errors, reload, and debug log](#w261003fx70-req7r1-configuration-file-errors-reload-and-debug-log)
   - [W261003FX70-REQ8@R1: Jump list, recent files, and session restore](#w261003fx70-req8r1-jump-list-recent-files-and-session-restore)
   - [W261003FX70-REQ9@R1: Picker matching, preview, and search limits](#w261003fx70-req9r1-picker-matching-preview-and-search-limits)
6. [Research Impact Review](#6-research-impact-review)
7. [Historical Requirement Revisions](#7-historical-requirement-revisions)

# 1. Problem and Desired Outcome

## Problem Statement

DI1 delivered a vim editor for a folder, but the folder is not yet a knowledge base. There is no index, no way to discover commands beyond `:`, no config file, no persisted history, and explorer renames break links. The parent roadmap fixes most of DI2's architecture and contracts. It leaves open a set of choices: dependency versions, config error reporting, how rename edits reach closed files, worker packaging, state semantics, and picker constants. Local experiments also showed that two parent wirings would miss their own performance budgets.

## Desired Outcome

`Space` reveals every command. `Space f f` finds any file and `Space s g` searches notes and text files. `gd` follows `[[links]]` in notes but does nothing in code files. Backlinks list linked and unlinked mentions. Renames and moves keep every resolved link pointing at the same file. Options and keys load from `config.toml` with errors that name the file and line. Recent files, jumps, and the window layout survive restarts. A 10,000-note folder shows its first frame in < 200 ms and finishes indexing in < 3 s without blocking typing. The merged PR completes PH1, so `v0.1.0` can ship once the phase exit evidence passes.

# 2. Current and Expected State

## Current State

```text
so ~/notes → defaults only (no config file) → listDir + read → first frame → watcher
key → overlay? → ":"? → keymap({mode, filetype}) → command | pending prefix (no which-key) | vim
explorer r/m → FsOp → fsResult → repath open buffers            (links untouched)
markdown file type: source view + highlighter; analyze unused; no index, no pickers, no state file
```

DI1 has the registries, the store, the overlay host, `Prompt`, `readTextFile`, `atomicWrite`, own-op suppression, and the bench gate (`TARGETS = { sourceKeystrokeP95: 16, openFile: 50 }`, `scripts/bench-gate.ts:8`). Nothing reads a config or state file, the leader is hard-coded to Space (`src/core/kernel/vim/keys.ts:10`), and no jump list exists.

## Expected State

```text
so ~/notes → load config.toml (invalid → defaults + "config.toml:7 …") → load state.json → restore layout
          → first frame → spawn index worker → scan + summarize (fast scan) → indexBatch* → ready
Space ─300 ms→ which-key │ Space f f → files picker (NoteIndex.files, fuzzy) → open + push jump
gd on [[plan#Goals]] → scan-level link at cursor → resolveLink → open at heading → "jump 2/2"
<leader>lr / explorer r,m → planRename (summaries + open analyses) → impact prompt → fs op
          → open buffers edited in memory + closed files edited by a validated atomic-edit effect
```

The Markdown file type gains a fast whole-document scan (headings, links, tags, block ids, frontmatter) and a lazily parsed mdast node per block. The index worker summarizes notes with the same scan, so 10,000 notes fit the 3 s budget.

# 3. Scope

## In Scope

- Everything in RM261003ABZP-DI2@R2 Scope (phase file `:447-472`). See W261003FX70-REQ1@R1.
- The refinements decided here:
  - dependency pins and the TOML parser (REQ2);
  - the two-level Markdown model (REQ3);
  - worker packaging and lifecycle (REQ4);
  - index freshness (REQ5);
  - the link-safe edit pipeline (REQ6);
  - config errors, `:ConfigReload`, and `SO_LOG` (REQ7);
  - jump, recents, and session semantics (REQ8);
  - picker matching, preview, and search limits (REQ9).

## Out of Scope

- Every DI2 exclusion in the phase file (`:473-477`): styled link rendering and the unresolved-link colour (DI3), inline embeds (DI3), calendar and template pickers (DI4), and `.obsidian/`.
- Config options owned by later DIs: `preview.*` (DI3), `daily.*` and `templates.*` (DI4). In DI2 they are unknown keys and produce config errors.
- Cutting the real `v0.1.0` release (PH1 exit).
- Writing parent roadmap files. This run has no parent-write authorization; parent changes are reported as pending synchronization.
- **Deferred — `editor.tabWidth`, `editor.wrap`, `editor.relativeNumbers`.**
  - **Reason:** RM261003ABZP-DES14@R1 lists them in AppConfig, but no DI scope assigns them and DI1 has no soft wrap or line-number options. Soft wrap is a `layoutText` and view concern.
  - **Trigger:** parent synchronization assigns them, with the proposal to give them to RM261003ABZP-DI3@R2, which owns the view work. Until then they are unknown keys.
- **Deferred — regex search in the grep picker.**
  - **Reason:** literal smart-case search covers note search and avoids catastrophic patterns in the worker.
  - **Trigger:** user demand after `v0.1.0`.

## Roadmap Assignment

- **Binding and parent scope:** `w261003fx70-discuss-context.md`, Roadmap Binding. RM261003ABZP-DI2@R2 is defined at `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:429-517`, in phase RM261003ABZP-PH1@R2. It consumes gate G1 and produces gates G2 and G3.
- **Assigned requirement coverage:**
  - RM261003ABZP-REQ3@R4 → W261003FX70-REQ1@R1 (inherited), W261003FX70-REQ7@R1 (config), W261003FX70-REQ8@R1 (recents, jumps, state), W261003FX70-REQ9@R1 (pickers).
  - RM261003ABZP-REQ4@R3 → W261003FX70-REQ1@R1 (inherited), W261003FX70-REQ3@R1 (syntax recognition), W261003FX70-REQ5@R1 (backlinks freshness), W261003FX70-REQ6@R1 (rename, move, link-mention), W261003FX70-REQ8@R1 (`Ctrl-o`/`Ctrl-i`).
  - RM261003ABZP-REQ9@R2 (startup and index part) → W261003FX70-REQ1@R1, W261003FX70-REQ3@R1, W261003FX70-REQ4@R1.
  - RM261003ABZP-REQ11@R3 (`syntaxExtensions`) → W261003FX70-REQ1@R1, W261003FX70-REQ3@R1.
  - UI obligations stay bound through W261003FX70-REQ1@R1 and are not redefined here: M3@R1, M4@R1 (S1–S9, S18), M1@R1 (panel and indexing states), and manifest AD4; UREQ5@R2, UREQ6@R1, UREQ1@R2, UREQ7@R2, and UREQ11@R1; UDES5@R2, UDES6@R1, UDES1@R2, UDES7@R2, and UDES11@R1; US3@R2, US4@R1, US1@R2, US5@R2, and US9@R1; UV4@R2, UV5@R1, UV1@R2 (index and panel states), UV6@R2 (move impact), and UV10@R1 (picker selection).
- **Baseline and due-gate assessment:**
  - **Baseline match.** On 2026-10-03 the current index and phase file match the accepted binding (context check at commit `3f01513`).
  - **Gate G1** is due before DI2 execution and is met: DI1 merged as `c98aa19` (PR #1) with CI green. G2 and G3 are future gates that DI2 produces; they do not block this stage.
  - **Parent wiring that would miss its own budgets.** Two parent wirings would make DI2 miss its own verification:
    - The Doc model names `parseDoc → summarize` for the worker (`rm261003abzp-design.md:378`, DES6 callers `:590`). A full mdast parse of 10,000 notes takes 11.8 s, against the < 3 s target of RM261003ABZP-V13@R1.
    - RM261003ABZP-DES14@R1 names `Bun.TOML.parse`, which reports no TOML line. That fails RM261003ABZP-V4@R2 (c).

    REQ2 and REQ3 keep the parent outcomes and replace only these mechanisms.
  - **Compiled-binary worker.** The parent build command compiles only `src/app/main.ts`, so a release binary would run without its worker. REQ4 adds the worker entrypoint.
  - **Reporting.** Each of these is a refinement that changes no contract consumed by DI3 or DI4. The system design reports them, with the unassigned `editor.*` options, as pending parent synchronization.

## Affected Interfaces and Actors

- **Terminal user** — gains which-key, pickers, palette, help, config, links, backlinks, rename safety, and restored sessions.
- **Developer and CI** — `bun run check` and `test:ci` grow with the new suites. The bench gate adds the V13 startup and index benchmarks, and the compiled-binary worker test runs in `test:ci`.
- **DI3 and DI4 (G2 and G3 consumers)** — receive `parseDoc` with the block cache and `syntaxExtensions`, the Markdown key scope, the NoteIndex with `resolveLink`, the Picker with its preview contract, `Prompt`, and the `search` and `write` effects.
- **Operating system services** — file system, `fs.watch`, Bun `Worker`, XDG config and state directories.

# 4. Standards and Constraints

## Binding Standards

- `rm261003abzp-requirements.md:106-127` (RM261003ABZP-REQ3@R4) — leader and which-key, the picker family, palette and help filtered by file type, file-type keymaps, XDG config with file-and-line errors, and per-workspace state outside the workspace.
- `rm261003abzp-requirements.md:128-148` (RM261003ABZP-REQ4@R3) — the recognized syntax, the resolution order, follow, create, completion, backlinks with link-mention, tags, and format-preserving rename and move. `.obsidian/` is never touched.
- `rm261003abzp-requirements.md:226` (RM261003ABZP-REQ9@R2) — first frame < 200 ms and index < 3 s on 10,000 notes, with input responsive during indexing.
- `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:511-516` — DI2 may not change the resolution order or rename format preservation, change worker protocol semantics consumed by DI3 or DI4, persist the index, write non-user files into the workspace, or bind note keys outside `markdown`.
- `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:188-192` — AppState fields and Action and Effect variants arrive with the DI that uses them; the final shape equals RM261003ABZP-DES2@R2.
- `test/boundaries.test.ts:9-42` — the layer rules, including a pure `src/core` and a package-free `src/core/kernel`.
- `scripts/bench-gate.ts:8` — the DI1 benchmark targets stay in force (`openFile` 50 ms, `sourceKeystrokeP95` 16 ms; the gate fails above 2×).
- `.s1mple/S1MPLE.md` Implementation — lean code with no work-process identifiers.
- XDG Base Directory Specification 0.8 — config and state paths; relative values are ignored.
- TOML 1.0.0 — the config format.

## Constraints

- One Work, one PR (index Delivery Items).
- `bun run check` stays < 30 s and CI < 3 min (RM261003ABZP-S10@R1).
- The main thread never scans or reads every note, and the worker never writes files (`…phase-1…md:272`).
- No network access at runtime.

## Accepted Assumptions

- Self-drive applies to this run only.
- The binding uses M1@R1 and M3@R1 plus AD4. M1@R2 and M3@R2 are draft cycle-3 mockups awaiting the user's review (`ui-mockups/manifest.md:3-5`); if the user accepts them during DI2, the binding is reconciled. No behaviour difference is expected, because AD4 already accepts those states.
- The developer machine (Apple M1 Max) is the reference for the local measurements below. CI runners are slower, so budgets keep a margin.

## Dependencies

- `@opentui/core` 0.5.14 and Bun 1.4.2 — unchanged from DI1.
- Markdown packages and the TOML parser — REQ2.
- Bun `Worker` and `bun build --compile` with multiple entrypoints — REQ4.
- DI1 contracts: `CommandRegistry`, `Keymap` with `KeyScope`, `FileTypeRegistry` and `analyze`, `layoutText`, `OverlayHost`, `Prompt`, `readTextFile`, `atomicWrite`, `OwnOps`, `ExclusionMatcher`, and the effect runner's serial file-system queue.

## Discussion Evidence

These local experiments ran on 2026-10-03 with Bun 1.4.2 on an Apple M1 Max. The scripts were throwaway files in the session scratchpad.

| Question | Result | Consequence |
|---|---|---|
| Does `Bun.TOML.parse` report the TOML line of a syntax error? | No. The thrown `SyntaxError` carries `line: 2, column: 16`, the calling JavaScript frame, for an error on TOML line 7. | V4 (c) needs another parser (REQ2, REQ7). |
| Does `smol-toml` 1.9.0 report it? | Yes: `TomlError` at line 7, column 5. It has no source positions for keys. | Unknown keys would need a hand-written key locator. |
| Does `toml-eslint-parser` 1.0.3 report it? | Yes for syntax errors (`lineNumber`, `column`). Its AST carries `loc` for every key and table, and `getStaticTOMLValue` returns the plain value. | One parser gives lines for syntax errors, unknown keys, and invalid values (REQ2, REQ7). |
| Does a `bun build --compile` binary run a `Worker`? | Only when the worker file is passed as an extra entrypoint and loaded with `new URL("./worker.ts", import.meta.url)`. With one entrypoint, or a plain string path, the worker fails silently. | REQ4. |
| How long does a full mdast parse of 10,000 notes of ~1 KB take? | 11.8 s with gfm and math; 8.6 s with core CommonMark; 36 ms for a line scan of the same notes. | The index cannot summarize through a full mdast parse (REQ3). |
| How large is the DI1 `openFile` fixture? | 5,000 lines of ~60 bytes (about 300 KB; `test/fixtures/generate.ts:13-22`). A full mdast parse at the measured rate takes about 350 ms. | Whole-document mdast on open would exceed the 100 ms `openFile` gate (REQ3). |

## Risks and Compatibility

- **Scan and mdast disagreeing** — the fast scan and the per-block mdast parse could classify edge cases differently, such as indented code or HTML blocks. REQ3 requires one syntax definition per Obsidian syntax and a conformance test over a shared corpus.
- **Partial index during rename** — rewriting from a partial index would miss links. REQ6 refuses rewrites until the index is ready.
- **Stale summaries for closed files** — REQ6 re-validates every span against the current disk text before writing.
- **Worker missing from release binaries** — REQ4 tests the compiled binary in CI.
- **Config written for later versions** — `preview.*` and `daily.*` keys are config errors in `v0.1.0`; the error names the key and line, and defaults apply.
- **Compatibility** — notes stay Obsidian-valid. `so` writes into the workspace only the user's files and the same-directory temporary files of an atomic save. The state file and log live under `$XDG_STATE_HOME/so/`.

# 5. Current Requirements

## W261003FX70-REQ1@R1: Inherited DI2 obligations

**Requirement ID:** `W261003FX70-REQ1`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** Which parent obligations must this Work deliver unchanged?

**Answer:** All of RM261003ABZP-DI2@R2 as defined in the phase file:

- its Scope, Exclusions, and the DI2 rows and code shapes of the Phase Design;
- Design RM261003ABZP-DES5@R2, DES6@R1, DES7@R3, DES8@R2 (rename and link-mention writes), DES10@R2, DES14@R1, DES16@R1, and DES17@R1;
- Success RM261003ABZP-S3@R1, S4@R1, and S9@R1 (startup and index part), with Verification RM261003ABZP-V4@R2, V5@R1, V6@R2, and V13@R1;
- the UI scope with US3@R2 (UV4@R2), US4@R1 (UV5@R1), US1@R2 (UV1@R2 index and panel states), US5@R2 (UV6@R2 move impact), and US9@R1 (UV10@R1 picker selection);
- the cross-work integration re-pass of RM261003ABZP-V1@R1, V17@R1, and V18@R1 in DI2's CI run;
- the outputs of gates G2 and G3;
- the downstream work boundary (`…phase-1…md:511-516`).

The requirements below refine these. None waives one, and REQ2–REQ4 replace only mechanisms whose parent wiring would fail the parent's own verification.

**Rationale:** The roadmap already fixes the architecture and the contracts, so restating them would only create drift. One inheritance requirement gives planning a single traceable anchor, the same pattern DI1 used (W261003HEGE-REQ1).

**Acceptance Criteria:**

- [ ] Every parent REQ, DES, S, V, and UI record listed above maps to at least one decision in the W261003FX70 system design.
- [ ] V4@R2, V5@R1, V6@R2, V13@R1, UV4@R2, UV5@R1, and the DI2 states of UV1@R2, UV6@R2, and UV10@R1 pass in CI on the DI2 PR, and V1@R1, V17@R1, and V18@R1 still pass there.
- [ ] Beyond the phase file's DI2 lists (`…phase-1…md:190`, `:221-222`), every AppState field and Action or Effect variant DI2 adds is additive and reported for parent synchronization. No variant for DI3 or DI4 is added.
- [ ] No note key or note command is bound outside the `markdown` file type. The index is never persisted, and nothing but user files is written into the workspace.
- [ ] The worker protocol keeps the phase file's messages and their meaning. Any field DI2 adds is optional and additive.

**Depends On:** None

## W261003FX70-REQ2@R1: Added dependencies and pins

**Requirement ID:** `W261003FX70-REQ2`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** Which packages does DI2 add, at which versions, and which TOML parser reads the config?

**Answer:**

- **Markdown (RM261003ABZP-DES6@R1 set):** `mdast-util-from-markdown` 2.0.3, `micromark-extension-gfm` 3.0.0, `mdast-util-gfm` 3.1.0, `micromark-extension-math` 3.1.0, `mdast-util-math` 3.0.0, and `yaml` 2.9.1 for frontmatter. These are the latest stable releases on 2026-10-03.
- **TOML:** `toml-eslint-parser` 1.0.3 replaces `Bun.TOML.parse`. It is a TOML 1.0 parser whose errors carry the line and column, and whose AST locates every key and value.
- **Pinning:** every addition is an exact pin with `bun.lock` committed, as DI1 established (W261003HEGE-REQ2@R2).
- **Where they may be imported:**
  - The Markdown packages only from `src/core/lang/markdown`.
  - The TOML parser only from the config loading code, never from `src/core/kernel` or `src/ui`.
- **Docs:** `.s1mple/docs/project.md` lists the new pins.

**Rationale:** The DES6 set keeps the parent's parse model and gives DI3 the GFM and math nodes it renders. Pinning it in DI2 means DI3 changes no parser.

`Bun.TOML.parse` cannot meet RM261003ABZP-V4@R2 (c), because its error reports the JavaScript call site rather than the TOML line (Discussion Evidence). `smol-toml` reports syntax-error lines but has no key positions, so unknown keys and invalid values would need a hand-written locator. `toml-eslint-parser` gives positions for all three error kinds from one AST. It costs one small transitive dependency (`eslint-visitor-keys`), and the config file is read only at startup and on reload, so its speed is irrelevant.

Rejected options:

- `Bun.TOML.parse`: fails V4 (c).
- `smol-toml` with a hand-written locator: more code to maintain.
- Deferring math to DI3: DI2's parse would then change in DI3, and math spans must already be skipped when DI2 extracts tags and links.

```json
{ "dependencies": { "mdast-util-from-markdown": "2.0.3", "micromark-extension-gfm": "3.0.0", "mdast-util-gfm": "3.1.0",
                    "micromark-extension-math": "3.1.0", "mdast-util-math": "3.0.0", "yaml": "2.9.1", "toml-eslint-parser": "1.0.3" } }
```

**Acceptance Criteria:**

- [ ] `package.json` lists each package above at its exact version, `bun.lock` is committed, and `bun install --frozen-lockfile` succeeds in CI.
- [ ] A config with a syntax error on line 7 produces an error naming `config.toml:7` (V4 (c)). An unknown key and an invalid value each name their own line.
- [ ] The boundary test fails when a Markdown package is imported outside `src/core/lang/markdown`, or when the TOML parser is imported from `src/core/kernel` or `src/ui`.
- [ ] knip reports no unused dependency.

**Depends On:** W261003FX70-REQ1@R1

## W261003FX70-REQ3@R1: Two-level Markdown model within the performance budgets

**Requirement ID:** `W261003FX70-REQ3`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How does DI2 parse Markdown so that indexing 10,000 notes takes < 3 s and opening the 5,000-line note stays inside the DI1 `openFile` gate?

**Answer:** The Markdown model has two levels built on one block split, and every Obsidian syntax is defined once.

- **Scan (whole document, fast):**
  - `splitBlocks` (blank-line bounded; fences, frontmatter, `$$` math, and lists kept whole) classifies each block.
  - The scan extracts frontmatter (`tags`, `aliases`, and links in string values), headings, links (wiki, embed, and Markdown links to any file), tags (inline, nested, frontmatter), and block ids.
  - Code (fenced, indented, inline), math, `%%comments%%`, and HTML comments are skipped.
  - It runs in linear time without building a syntax tree.
- **mdast (per block, lazy):** a block's mdast node, with GFM, math, and the Obsidian transforms, is parsed only when first requested and cached by block hash. DI2 requests it only in tests; DI3's live preview and HTML rendering are its consumers.
- **One definition per syntax:** each entry in the `syntaxExtensions` registry (wikilink, embed, tag, highlight, comment, callout, blockId, footnote, math) supplies both its scan pattern and its mdast transform.
- **Consumers:**
  - `parseDoc(buf, prev)` returns `Doc { version, frontmatter?, blocks, scan }` and reuses unchanged blocks by hash. It is the `markdown` file type's `analyze`, computed in `update` for the buffer's current version.
  - The NoteIndex summarizer — in the worker and for saved buffers — uses the scan only.
  - The outline and headings picker, link at cursor, `[[` completion, rename spans, and mention exclusion also use the scan.

**Rationale:** The parent intends one parsed model shared by every consumer (RM261003ABZP-DES6@R1), and mdast is the right model for rendering. Measurements show it cannot be the index path:

- A full parse of 10,000 notes takes 11.8 s on an M1 Max, about 4× the < 3 s budget, while a line scan takes 36 ms.
- A full parse of the 300 KB `openFile` fixture would take about 350 ms, against a 100 ms gate.

Splitting by cost rather than by consumer keeps both budgets by construction (RM261003ABZP-DES16@R1). Defining each syntax once removes the main risk of two levels, which is drift.

Rejected options:

- Several mdast workers: still about 4–6 s on the 3–4 core CI runners.
- Replacing micromark with a faster CommonMark parser: changes DES6 for DI3.
- An index-only regex scanner unrelated to `parseDoc`: two independent grammars.

```text
TextBuffer ──splitBlocks──► blocks[{kind, startLine, endLine, hash}]
                 │                     │
                 ▼                     ▼ (lazy, cached by hash)
       scan: frontmatter, headings,   mdast node per block (GFM, math,
       links, tags, blockIds          Obsidian transforms) → DI3 rendering
                 │
   summarize → NoteSummary (worker, saved buffers); outline; link at cursor; rename; completion
```

**Acceptance Criteria:**

- [ ] Every syntax in RM261003ABZP-REQ4@R3's recognized list is extracted by the scan, with tests for links inside code, math, and comments being ignored.
- [ ] A conformance test runs the scan and the mdast level over a shared corpus and asserts that they find the same links, tags, headings, and block ids. Any accepted difference is listed in the test.
- [ ] `parseDoc(buf, prev)` equals `parseDoc(buf)` structurally, and editing one block re-scans only blocks whose hash changed.
- [ ] RM261003ABZP-V13@R1: index ready < 3 s on the generated 10,000-note workspace in CI, through the bench gate.
- [ ] With Markdown analysis enabled, the DI1 `openFile` and `sourceKeystrokeP95` benchmarks on the 5,000-line note stay inside their gates.

**Depends On:** W261003FX70-REQ2@R1

## W261003FX70-REQ4@R1: Index worker packaging and lifecycle

**Requirement ID:** `W261003FX70-REQ4`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How does the index worker ship in the compiled binary, and how does `so` behave when the worker fails?

**Answer:**

- **Build:** `src/workspace/index-worker.ts` is a second entrypoint of every compile. The `build` script and the release workflow both pass it, and `src/app/main.ts` creates the worker with `new Worker(new URL("../workspace/index-worker.ts", import.meta.url))`. The same code runs from source and from the binary.
- **Start:** the worker starts after the first frame (phase file `:155`).
- **Failure:** a worker `error` event, an unexpected exit, or an `error` message counts as a crash. The first crash restarts the worker once with a fresh scan. A second crash leaves the index status `unavailable`: the statusline shows `index unavailable`, and editing continues.
- **Without a ready index:** while the index is building or unavailable, link features answer from the partial index. Commands that need a complete index say why they cannot run (REQ6).
- **Tests:** a CI test builds the binary with the `build` command, starts it in a PTY on a small workspace, and asserts that indexing reaches `ready`.

**Rationale:** The experiment showed that a single-entrypoint binary drops the worker silently. The release smoke runs only `so --version`, so this defect would reach users unseen. Testing the real binary in `test:ci` on both runners proves the packaging where it can fail. Using the same `new URL(…)` form from source and from the binary avoids a release-only code path.

Rejected options:

- Inlining the worker as a Blob URL: an unusual build step.
- Running the index on the main thread: fails the keystroke budget during indexing.

**Acceptance Criteria:**

- [ ] `bun run build` and the release workflow compile `src/app/main.ts` and `src/workspace/index-worker.ts` together.
- [ ] The compiled-binary test reaches index `ready` on `ubuntu-24.04` and `macos-15` in `test:ci`.
- [ ] Integration tests with the `SO_TEST_THROW` style hook show one restart after the first crash and `index unavailable` after the second, with editing still working.
- [ ] Typing during indexing meets the keystroke budget (RM261003ABZP-V13@R1).

**Depends On:** W261003FX70-REQ1@R1

## W261003FX70-REQ5@R1: Index freshness

**Requirement ID:** `W261003FX70-REQ5`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** When do the index, backlinks, and completion see a change, given that the watcher suppresses `so`'s own writes?

**Answer:**

- **Changes by other programs:** they reach the worker through the watcher's `changed` and `removed` events, and the worker sends updated summaries.
- **Changes made by `so`:** the main thread updates the index itself, because own-op suppression hides them from the worker.
  - A `saved` result re-summarizes that buffer from its current scan.
  - A successful create, rename, move, or trash updates `files` and the summaries.
  - A successful link-edit write re-summarizes the edited file.
- **Index reads:** backlinks, tags, unlinked mentions, `[[` completion of other notes, and link resolution read the index. Unsaved edits therefore appear after the next save; autosave runs 1 s after typing stops.
- **Current buffer:** the outline, headings picker, link at cursor, and completion of the current note's own headings and block ids read the buffer's live scan.

**Rationale:** Summarizing from the buffer on save costs one scan of one file and keeps the worker the only reader of closed files. Using the live scan for the current note gives immediate feedback where the user is typing, without rebuilding derived index maps on every keystroke.

Rejected options:

- Re-summarizing dirty buffers into the index on every edit: per-keystroke index churn.
- Re-reading saved files in the worker: duplicates I/O the main thread already did and races with the watcher's suppression window.

**Acceptance Criteria:**

- [ ] A link added and saved in `a.md` appears in `b.md`'s backlinks without a file event reaching the worker.
- [ ] A link written to a closed file by another program appears after the watcher event.
- [ ] Create, rename, move, and trash through the explorer update the files picker and backlinks without a rescan.
- [ ] Adding `## New` in the current note shows it in the outline before any save.

**Depends On:** W261003FX70-REQ3@R1, W261003FX70-REQ4@R1

## W261003FX70-REQ6@R1: Link-safe rename, move, and link-mention edits

**Requirement ID:** `W261003FX70-REQ6`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How are link edits planned and applied without the main thread reading closed notes, and which links does a rename or move rewrite?

**Answer:**

- **Invariant:** after a rename or move, every link that resolved to a file before the operation still resolves to that same file, now at its new path. This covers:
  - links to the moved file;
  - outgoing links of moved notes, whose "same folder" ranking can change;
  - links elsewhere that the new name would otherwise capture.

  Only links whose resolution would change are rewritten. Each keeps its kind (wiki, Markdown, embed), alias, and heading or block subpath, and uses the shortest unique form of its target (RM261003ABZP-DES7@R3). Unresolved links are left unchanged.
- **Scope:** the invariant applies to files of any type and to folders. Every file under a moved folder maps to its new path.
- **Planning:** pure, with no file reads. `planRename(ix, ops, open)` takes link spans from the index summaries for closed notes and from the live scan for open buffers. It returns `FileEdit[]`, where each edit carries the span's expected current text.
- **Order:**
  1. An impact prompt (`31 links in 12 files`) runs first.
  2. The file-system operation runs next.
  3. Only after it succeeds are open buffers edited in memory (dirty, undoable as one change) and closed files edited.
- **Closed files:** a closed-file edit is a new effect. The effect runner reads the current text and checks every span's expected text. It writes through `atomicWrite` as an own operation if every span matches, and otherwise skips the file. The result toast reports the updated count and lists skipped or failed paths, with no revert (phase file `:171`).
- **Link-mention:** `link.linkMention` uses the same edit path (`linkMentionEdit`, phase file `:279-293`). Unlinked mentions are case-insensitive whole-word matches of the target's basename and aliases in other notes, outside links, code, math, comments, and frontmatter. The worker's `search` finds them.
- **Index not ready:** while indexing, rename, move, and `<leader>lr` refuse with `index not ready — try again when indexing finishes`. When the index is `unavailable`, the prompt warns `links will not be updated (index unavailable)` and, on confirmation, renames the file only.

**Rationale:** The parent signature `planRename(ix, from, to, read)` (`rm261003abzp-design.md:710`) needs a synchronous reader. That would put file I/O in pure core or force the main thread to read every referencing note. Summaries already hold link positions, so planning needs no reads, and re-validating spans at write time makes stale summaries safe: a changed file is skipped, never corrupted.

The resolution invariant is the testable form of "renames keep every link intact" (RM261003ABZP-S4@R1), and it covers the ambiguity cases the parent resolution order creates. Refusing during indexing prevents a silent partial rewrite; at the measured scan speed indexing takes seconds.

Rejected options:

- A read round-trip effect before planning: two-phase async state in `update`.
- Planning in the worker: the worker would own edit logic, and its protocol would change.
- File-only rename during indexing: silently breaks links.

**Acceptance Criteria:**

- [ ] RM261003ABZP-V6@R2 (a) and (b) pass, including the open dirty buffer edited in memory and the closed file written atomically.
- [ ] A property test over generated workspaces asserts that, for every resolved link, its target before a planned rename equals its target after applying the plan.
- [ ] Moving `c/deep/plan.md` to `plan.md` rewrites `[[plan]]` in `root.md`, which resolved to `a/plan.md`, to keep that target.
- [ ] A closed file changed on disk after indexing is skipped and listed in the toast, and its content is unchanged.
- [ ] A failed file-system operation applies no link edit. Rename during indexing shows the refusal message and changes nothing.

**Depends On:** W261003FX70-REQ3@R1, W261003FX70-REQ5@R1

## W261003FX70-REQ7@R1: Configuration file, errors, reload, and debug log

**Requirement ID:** `W261003FX70-REQ7`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** Which options does the config file accept in DI2, how are errors reported, and is there runtime reload and logging?

**Answer:**

- **Path:** `$XDG_CONFIG_HOME/so/config.toml`, or `~/.config/so/config.toml` when the variable is unset, empty, or relative. A missing file means defaults with no message.
- **Accepted keys:**
  - `leader` (one key, default Space), `escTimeoutMs`, `autosave.enabled`, `autosave.delayMs`, `theme`, `color`;
  - `[keys.<mode>]` with `"<key-seq>" = "<command-id>"`;
  - `[filetypes.<id>.keys.<mode>]` in the same form.

  Every other key is unknown in DI2.
- **Errors:**
  - These each name `config.toml:<line>`: a syntax error, an unknown key, an invalid value, an unknown command id, an unknown file-type id, and an unknown mode.
  - An invalid file is ignored as a whole; defaults apply and one error toast shows the first error and the count of others.
  - `:help` marks user bindings with `●`.
- **`:ConfigReload`:** re-reads the file and applies options and keymaps without a restart. An invalid file keeps the current config and shows the errors.
- **`SO_LOG=debug`:** appends a log to `$XDG_STATE_HOME/so/so.log` with startup, config, index, worker, and effect failures. The log holds paths and counts, never note content.

**Rationale:** These keys cover every option that has behaviour in DI1 and DI2 (phase file `:469` plus the parent `leader`). Accepting `editor.*` without behaviour would be a silent no-op. Line-precise errors for every kind meet RM261003ABZP-REQ3@R4.

Both `:ConfigReload` and the log are in the parent design assigned to DI2:

- `:ConfigReload` is in RM261003ABZP-DES14@R1's lifecycle. Keeping the keymap overrides in `AppState.config` and deriving the effective keymap from it makes reload a single action rather than a registry rebuild.
- `SO_LOG` is in DES14@R1's observability row and was moved to DI2 by `w261003hege-system-design.md:294`.

**Acceptance Criteria:**

- [ ] RM261003ABZP-V4@R2 (a)–(i) pass.
- [ ] `leader = ","` makes `,ff` open the files picker, and which-key shows `,`.
- [ ] `[editor] tabWidth = 4` produces an unknown-key error naming its line, and defaults apply.
- [ ] Editing the file and running `:ConfigReload` changes a binding without a restart. An invalid edit keeps the previous binding and shows the error.
- [ ] With `SO_LOG=debug`, `so.log` is created under the state directory and contains no line of note text from the test workspace. Without it, no log file is created.

**Depends On:** W261003FX70-REQ2@R1

## W261003FX70-REQ8@R1: Jump list, recent files, and session restore

**Requirement ID:** `W261003FX70-REQ8`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** What enters the jump list and recent files, and what does `so` restore on start?

**Answer:**

- **Jump list (Neovim semantics):**
  - Entries come from cross-file navigation — link follow, opening from any picker, the palette, the backlinks and outline panels, and `:e` — and from the in-buffer jump motions DI1 implements that Neovim records in its jumplist (`G`, `gg`, `/`, `?`, `n`, `N`).
  - Each entry is `{path, line, col}`. The list holds at most 100 entries, and an entry on the same line as an existing one replaces it.
  - `Ctrl-o` and `Ctrl-i` move through the list, and jumping from the middle truncates forward history as Neovim does.
  - The statusline shows `jump i/n`.
- **Recent files:** every successfully opened file, most recent first, deduplicated, at most 100. The recent picker hides entries missing from the index's `files`.
- **State file:**
  - Location: `$XDG_STATE_HOME/so/<sha256(realpath(root)).slice(0,16)>/state.json`, written atomically with mode `0600`.
  - Contents: `"version": 1`, recents, jumps, open buffers (path and view), and the window layout (split tree, active window, each window's path, cursor, and scroll). It holds no note text.
  - Saved 2 s after the last change and on exit.
- **Restore:**
  - Starting on a folder restores the layout.
  - Starting on a file opens only that file, while recents and jumps still load.
  - Missing or refused files are skipped, with one toast `n files from the last session were not found`.
  - A missing, corrupt, or unknown-version state file loads as empty.

**Rationale:** Matching Neovim keeps `Ctrl-o` predictable for vim users. The in-buffer cases can be recorded from Neovim with the existing `record:vim` harness, which gives the same equality evidence as the DI1 vim tests.

The 100-entry cap matches Neovim's jumplist limit and bounds the state file. Restoring only when started on a folder follows editor convention: an explicit file argument states intent.

Rejected options:

- Link-follow-only jumps: `Ctrl-o` after `G` would surprise vim users.
- Always restoring the layout, even with a file argument: the explicit file would be hidden among old windows.

**Acceptance Criteria:**

- [ ] Recorded Neovim cases for `G`, `gg`, `/`, `n` followed by `Ctrl-o` and `Ctrl-i` pass in `test/vim`.
- [ ] `gd`, `Ctrl-o`, `Ctrl-i` across two notes shows `jump 2/2` → `jump 1/2` → `jump 2/2`.
- [ ] Restart on the folder restores two split windows with their files and cursors. Restart with a file argument shows only that file.
- [ ] A corrupt `state.json` loads as empty without an error toast. A deleted file from the last session produces the single not-found toast.
- [ ] No file is created in the workspace by state saving.

**Depends On:** W261003FX70-REQ1@R1

## W261003FX70-REQ9@R1: Picker matching, preview, and search limits

**Requirement ID:** `W261003FX70-REQ9`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How do pickers rank matches, what do they preview, and what limits does text search have?

**Answer:**

- **Fuzzy matching (every picker, the palette, and `:` completion):**
  - The algorithm is fzf's v1 algorithm with fzf's published scoring constants:
    - match 16, gap start −3, gap extension −1;
    - boundary bonus 8, camel-case bonus 7, consecutive bonus 4;
    - the first character's bonus doubled.
  - Matching is smart-case: a query with no uppercase letter is case-insensitive.
  - Ties go to the shorter text, then alphabetical order.
  - It is pure code in `src/core`, with no dependency.
- **Preview:**
  - The preview pane appears only at ≥ 100 columns (`rm261003abzp-ui-design.md:1352-1430`).
  - File-based sources (files, recent, grep, headings, tags, backlinks) preview the file in source view with highlighting, centred on the target line with the match marked. Open buffers preview their in-memory text. Closed files are read through `readTextFile`, so a refused file shows its refusal text. A newer selection drops a stale read.
  - Commands and help preview the description, bindings, and scope.
  - The preview names its view id, so DI3 switches notes to the reading view without a contract change.
- **Text search (grep):**
  - Literal and smart-case over notes and text files within 16 MiB, skipping binary files.
  - The query is sent 100 ms after the last keystroke, and only the newest search id is applied.
  - At most 1,000 hits, each one line truncated to the picker width, with the counter showing `1000+` when capped.
  - An empty query shows nothing.

**Rationale:** The phase file leaves these three choices to DI2 (`:511`). fzf's scoring is the de facto standard for terminal pickers (fzf, Telescope's fzf sorter, fzf-lua). It ranks consecutive and word-start matches first, as RM261003ABZP-UDES5@R2 requires, and its documented constants avoid tuning by taste. A pure implementation is small and keeps ranking deterministic for the UV4 assertions (`srd` → `projects/so-roadmap.md`, `back` → `link.backlinks`).

Previewing through the source view reuses DI1's `EditorView`. Literal search avoids catastrophic regular expressions in the worker. The 1,000-hit cap and 100 ms debounce bound worker and paint work on a 10,000-note folder.

Rejected options:

- A fuzzy library dependency: no gain for one small algorithm.
- Regex search: deferred.
- Uncapped results.

**Acceptance Criteria:**

- [ ] RM261003ABZP-UV4@R2 passes, including `srd` → `projects/so-roadmap.md` first and `back` → `link.backlinks` first.
- [ ] Unit tests pin the scoring constants and tie-breaking, including smart-case.
- [ ] At 99 columns no preview is drawn. At 120 columns a grep hit previews its file centred on the hit line.
- [ ] A query matching more than 1,000 lines shows 1,000 rows and `1000+`. Typing quickly applies only the last query's results.

**Depends On:** W261003FX70-REQ4@R1, W261003FX70-REQ5@R1

# 6. Research Impact Review

None — research was skipped. Local experiments (section 4, Discussion Evidence) answered the external unknowns: TOML error positions, compiled-binary workers, and parse cost. The remaining choices follow from the parent design, Neovim and fzf conventions, and project standards.

# 7. Historical Requirement Revisions

None — no requirement has been revised or replaced.
