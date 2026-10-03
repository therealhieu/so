# W261003HEGE: editor-foundation — Requirements

**Document Status:** Ready for System Design

**Context Source:** `w261003hege-discuss-context.md`

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

**Approval evidence:** The user asked for a self-driven discussion on 2026-10-03: "self drive /s1mple-discuss about this DI - follow the requirementzs - choose options/designs/options that are stable, simple, easy to maintain and extend with industry compliance". Under that delegation the agent aligned the overview (T1–T5) and decided each requirement below, choosing the recommended option each time.

# Table of Contents

1. [Problem and Desired Outcome](#1-problem-and-desired-outcome)
2. [Current and Expected State](#2-current-and-expected-state)
3. [Scope](#3-scope)
4. [Standards and Constraints](#4-standards-and-constraints)
5. [Current Requirements](#5-current-requirements)
   - [W261003HEGE-REQ1@R1: Inherited DI1 obligations](#w261003hege-req1r1-inherited-di1-obligations)
   - [W261003HEGE-REQ2@R1: Exact toolchain and dependency pins](#w261003hege-req2r1-exact-toolchain-and-dependency-pins)
   - [W261003HEGE-REQ3@R1: Recorded Neovim expectations](#w261003hege-req3r1-recorded-neovim-expectations)
   - [W261003HEGE-REQ4@R1: Test layers, platforms, and PTY tooling](#w261003hege-req4r1-test-layers-platforms-and-pty-tooling)
   - [W261003HEGE-REQ5@R1: Quit and close with unsaved buffers](#w261003hege-req5r1-quit-and-close-with-unsaved-buffers)
   - [W261003HEGE-REQ6@R1: Open file deleted or moved outside so](#w261003hege-req6r1-open-file-deleted-or-moved-outside-so)
   - [W261003HEGE-REQ7@R1: System clipboard provider chain](#w261003hege-req7r1-system-clipboard-provider-chain)
   - [W261003HEGE-REQ8@R1: Trash mechanics per platform](#w261003hege-req8r1-trash-mechanics-per-platform)
   - [W261003HEGE-REQ9@R1: Workspace exclusion rules](#w261003hege-req9r1-workspace-exclusion-rules)
   - [W261003HEGE-REQ10@R1: Safe explorer operations and open buffers](#w261003hege-req10r1-safe-explorer-operations-and-open-buffers)
   - [W261003HEGE-REQ11@R1: Recognized languages and file types](#w261003hege-req11r1-recognized-languages-and-file-types)
6. [Research Impact Review](#6-research-impact-review)
7. [Historical Requirement Revisions](#7-historical-requirement-revisions)

# 1. Problem and Desired Outcome

## Problem Statement

The repository holds only `.s1mple/` guidance. RM261003ABZP-DI1@R2 must turn it into a usable, released-capable editor in one PR: a language-neutral kernel, vim editing, safe file handling, an OpenTUI shell, and the full toolchain, CI, and release path. The parent baseline fixes the architecture and contracts. It leaves open the version pins, how vim and terminal behaviour are proven, and several data-safety and platform behaviours that the parent acceptance criteria do not spell out: quitting with unsaved edits, files deleted outside `so`, clipboard and trash mechanics, exclusion rules, explorer operations on open files, and the language set.

## Desired Outcome

`so ~/notes` opens a folder in which the user edits notes and any UTF-8 text file with vim keys, safe autosave, explorer file operations, and a restored terminal on every exit. Every parent obligation assigned to DI1 holds, and each open choice above has one testable answer, so system design and planning need no further product decisions.

# 2. Current and Expected State

## Current State

```text
so/ (main, 1 commit)
├── .s1mple/   guidance, roadmap RM261003ABZP, this work folder
├── .gitignore, AGENTS.md, CLAUDE.md
└── (no package.json, src/, test/, .github/)
```

Nothing can be run, checked, or released. The parent design describes the target but marks the OpenTUI, `fs.watch`, trash, lowlight, and release-please details as DI1 confirmations.

## Expected State

```text
so [path] ─► OpenTUI shell (explorer │ editor windows │ statusline │ cmdline)
   key ─► update (pure) ─► vim / commands ─► TextBuffer ─► layoutText (marks) ─► paint
   edit ─► autosave ─► atomicWrite ─► watcher (own write ignored)
   external change ─► reload (undoable) │ conflict k/t/d │ deleted on disk notice
   :q / :q! / signals / crash ─► flush rules ─► terminal restored
toolchain: bun run check (<30 s) ─► CI check ∥ test (ubuntu + macOS) ─► rc tag ─► 4 binaries + SHA256SUMS
```

DI1 produces gate G1 for DI2 with every contract at its parent shape.

# 3. Scope

## In Scope

- Everything listed in RM261003ABZP-DI1@R2 Scope (phase file, Delivery Items, DI1 Scope) — see W261003HEGE-REQ1@R1.
- The refinements decided here: version pins (REQ2), Neovim expectation recording (REQ3), test platforms and PTY tooling (REQ4), quit and close rules (REQ5), external deletion and moves (REQ6), clipboard providers (REQ7), trash mechanics (REQ8), exclusion rules (REQ9), explorer operations on open buffers (REQ10), and the language set (REQ11).

## Out of Scope

- Every DI1 exclusion in the phase file: config file loading, which-key, pickers, palette, help, Markdown-scoped keys, state persistence, links, and index (DI2); live and reading views, widgets, preview (DI3); daily notes, templates, Bases (DI4); the index Deferred Scope.
- Cutting the real `v0.1.0` release (PH1 exit).
- Writing parent roadmap files (no parent-write authorization in this run).
- **Deferred — showing hidden files in the explorer (a toggle).** Reason: the parent rule excludes hidden folders and the accepted mockups show no toggle. Trigger: user demand after `v0.1.0`; it would need a UI revision.
- **Deferred — topdir trash (`$topdir/.Trash-$uid`) for workspaces on another device than `$HOME`.** Reason: the parent acceptance names only the home trash; the typed-confirm fallback keeps the operation safe. Trigger: a user workspace on an external volume reports the fallback as friction.
- **Deferred — crash-recovery files (swap or recovery copies).** Reason: autosave bounds unsaved work to about 1 s and REQ5 flushes on crash; recovery files would write outside the user's files. Trigger: data-loss report traced to a crash before flush.

## Roadmap Assignment

- **Binding and parent scope:** `w261003hege-discuss-context.md`, Roadmap Binding — RM261003ABZP-DI1@R2 in `rm261003abzp-roadmap-phase-1-daily-usable-editor.md` (Delivery Items, DI1), phase RM261003ABZP-PH1@R2, producer of gate G1.
- **Assigned requirement coverage:**
  - RM261003ABZP-REQ1@R3 → W261003HEGE-REQ1@R1 (inherited), W261003HEGE-REQ5@R1, W261003HEGE-REQ6@R1, W261003HEGE-REQ8@R1, W261003HEGE-REQ9@R1, W261003HEGE-REQ10@R1, W261003HEGE-REQ11@R1.
  - RM261003ABZP-REQ2@R2 → W261003HEGE-REQ1@R1 (inherited), W261003HEGE-REQ3@R1, W261003HEGE-REQ5@R1 (`:q`, `:q!`, `:bd`), W261003HEGE-REQ7@R1 (`"+`).
  - RM261003ABZP-REQ9@R2 (harness and gate mechanism only) → W261003HEGE-REQ1@R1, W261003HEGE-REQ4@R1.
  - RM261003ABZP-REQ10@R2 → W261003HEGE-REQ1@R1, W261003HEGE-REQ2@R1, W261003HEGE-REQ4@R1.
  - RM261003ABZP-REQ11@R3 → W261003HEGE-REQ1@R1, W261003HEGE-REQ4@R1 (restore proof), W261003HEGE-REQ11@R1 (file-type registration).
  - UI obligations (M1@R1, M4@R1, AD4; UREQ1@R2, UREQ2@R1, UREQ3@R2 non-Markdown part, UREQ7@R2, UREQ11@R1; UDES1@R2, UDES2@R1, UDES3@R2 non-Markdown part, UDES7@R2, UDES11@R1; US1@R2, US5@R2, US9@R1; UV1@R2, UV2@R1, UV6@R2, UV10@R1) stay bound through W261003HEGE-REQ1@R1 and are not redefined here.
- **Baseline and due-gate assessment:** On 2026-10-03 the current index and phase file match the accepted binding (PH1@R2, DI1@R2, the REQ/DES/S/V and UI revisions above); DI1 has no prerequisite and no gate is due before requirements approval. No W other than W261003HEGE is bound to DI1. Every refinement here adds behaviour the parent leaves open and changes no shared contract (Command, KeyScope, FileType, ViewSpec, EditorKindSpec, Decoration, RenderLine, layoutText, Action/Effect DI1 variants). Two accepted-message additions — `deleted on disk` (REQ6) and the conflict-on-quit text (REQ5) — reuse the accepted message-line and toast visuals under manifest AD4, so no mockup revision is needed.

## Affected Interfaces and Actors

- **Terminal user** — gains every DI1 behaviour; the new rules decide what quitting, external deletion, clipboard, and trash do.
- **Developer and CI** — run `bun run check`, the test matrix, the vim recorder, and the bench gate.
- **DI2 (consumer of G1)** — reuses the exclusion rule (REQ9) in its worker and the contracts unchanged.
- **Operating system services** — POSIX file system, `fs.watch`, freedesktop trash, macOS Trash, clipboard commands, PTY.

# 4. Standards and Constraints

## Binding Standards

- `rm261003abzp-requirements.md:59-82` (RM261003ABZP-REQ1@R3) — atomic save, BOM and EOL preservation, refusal rules and texts, directory watching, freedesktop home trash, typed-confirm fallback; REQ5, REQ6, REQ8, REQ9, REQ10 may only add to these.
- `rm261003abzp-requirements.md:83-105` (RM261003ABZP-REQ2@R2) — the vim command set and Neovim equality (S2/V2 with Neovim 0.11 `--clean`); REQ3 records exactly that reference.
- `rm261003abzp-requirements.md:248-269` (RM261003ABZP-REQ10@R2) — check < 30 s, CI < 3 min, exact `@opentui/core` pin, no compiler-API tools, four-target release; REQ2 and REQ4 must fit these budgets.
- `rm261003abzp-requirements.md:270-294` (RM261003ABZP-REQ11@R3) — boundaries, registration-only extension, XDG 0.8, `NO_COLOR`, Conventional Commits 1.0.0, SemVer 2.0.0, strict TS ESM, restore on every exit path, macOS and Linux.
- `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:416-423` — DI1 may not add later-DI AppState fields, weaken safety, restore, or boundary rules, change G1 contracts, or add language code to `core/kernel`.
- `.s1mple/S1MPLE.md:59` — keep the implementation lean and simple.
- freedesktop.org Trash specification 1.0 — trash layout (`files/`, `info/*.trashinfo`); REQ8.
- gitignore pattern format (git documentation) — REQ9.

## Constraints

- One Work, one PR (index Delivery Items). Releases happen only at phase exit; DI1 proves the release path on `v0.1.0-rc.1`.
- No network access at runtime; clipboard and trash use local system commands only.
- `so` writes nothing into the workspace except the user's files and its own same-directory temporary save files, which are removed or renamed by the save.

## Accepted Assumptions

- Self-drive applies to this run only; the user's words above are the approval evidence.
- Cycle 3 draft mockups (M1@R2, M3@R2) are not part of the binding until the user accepts them.
- The developer machine (macOS, Apple silicon) is the reference machine for `bun run check` timing.

## Dependencies

- `@opentui/core` — renderer, input, test renderer; pinned by REQ2.
- Bun — runtime, test runner, compiler, `fs.watch`, PTY support (REQ4); pinned by REQ2.
- `lowlight` (highlight.js grammars) — REQ11.
- Neovim 0.11 — only on the developer machine, for REQ3 recording.
- GitHub Actions `ubuntu` and `macos` runners — REQ4.

## Risks and Compatibility

- **OpenTUI API drift** — the parent shapes are illustrative; a material mismatch returns to roadmap design clarification (phase file, Downstream work boundary). REQ2 pins the version and research confirms the APIs.
- **Recursive `fs.watch` differences between macOS and Linux** — REQ4 runs V1 on both platforms; a failure returns to design.
- **Finder automation permission on macOS** — REQ8 prefers the non-prompting `/usr/bin/trash` and keeps the typed-confirm fallback.
- **Signal-time flush hanging** — REQ5 bounds it so restore always happens.
- **Compatibility** — notes stay Obsidian-valid; other text files keep BOM, EOL, and trailing newline; `.obsidian/` is never touched.

# 5. Current Requirements

## W261003HEGE-REQ1@R1: Inherited DI1 obligations

**Requirement ID:** `W261003HEGE-REQ1`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** Which parent obligations must this Work deliver unchanged?

**Answer:** All of RM261003ABZP-DI1@R2 as defined in the phase file: its Scope, Exclusions, Design (RM261003ABZP-DES1@R2, DES2@R2, DES3@R1, DES4@R1, DES5@R2, DES8@R1, DES9@R3 kernel view, DES10@R2, DES15@R1, DES16@R1, DES17@R1, and the DI1 part of DES14@R1), the DI1 Phase Design rows and code shapes, the G1 outputs, Success RM261003ABZP-S1@R1, S2@R1, S10@R1, S11@R1 (boundary and restore part), S12@R1, Verification RM261003ABZP-V1@R1, V2@R1, V3@R1, V14@R1, V15@R2, V17@R1, V18@R1, and the UI scope with US1@R2 (UV1@R2 DI1 states, UV2@R1), US5@R2 (UV6@R2), and US9@R1 (UV10@R1 DI1 states). The requirements below refine these; none waives one.

**Rationale:** The roadmap already fixes architecture and contracts, so restating them would only create drift. One explicit inheritance requirement gives planning a single traceable anchor for every parent obligation, and the later requirements cover only what the parent leaves open.

**Acceptance Criteria:**

- [ ] Every parent REQ, DES, S, V, and UI record listed above maps to at least one design decision in the W261003HEGE system design.
- [ ] Every G1 output named in the phase file exists on the merged DI1 PR with V1, V2, V15@R2, V17, and V18 passing in CI.
- [ ] No AppState field, Action, or Effect beyond the phase file's DI1 lists is added.
- [ ] UV1's DI1 statusline for `scripts/sync.ts` is `MODE │ source │ scripts/sync.ts │ Ln:Col` (the `index` segment arrives in DI2 and `preview` in DI3, per the phase file UI refinement).

**Depends On:** None

## W261003HEGE-REQ2@R1: Exact toolchain and dependency pins

**Requirement ID:** `W261003HEGE-REQ2`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** Which Bun, `@opentui/core`, TypeScript, and dependency versions does DI1 pin, and how?

**Answer:** Pin the latest stable release of each tool on 2026-10-03 that research confirms compatible with the others: Bun 1.4.2, `@opentui/core` 0.5.14, `typescript` 7.0.2, `lowlight` 3.3.0, and the current stable Biome, knip, and zod. If research finds an incompatibility, pin the newest compatible stable version instead and record why. Every dependency is pinned exactly (no `^` or `~`), `bun.lock` is committed, CI installs with `--frozen-lockfile`, and the Bun version comes from one source — `package.json` `packageManager` — for local runs and CI. Upgrades are deliberate PRs.

**Rationale:** Exact pins and a frozen lockfile are the standard way to get reproducible builds and stable benchmark baselines (RF1). Choosing the latest stable versions now avoids starting the project on already-outdated tools. A single version source keeps CI and local runs identical. Alternatives rejected: pinning the locally installed Bun 1.3.10 (older for no reason) and caret ranges (non-reproducible builds and moving benchmark baselines).

```json
{ "packageManager": "bun@1.4.2", "dependencies": { "@opentui/core": "0.5.14", "lowlight": "3.3.0" } }
```

**Acceptance Criteria:**

- [ ] `package.json` lists every dependency with an exact version, and `bun.lock` is committed.
- [ ] CI installs with `bun install --frozen-lockfile` and reads the Bun version from `packageManager`.
- [ ] The pinned versions and any deviation from "latest stable on 2026-10-03" are recorded in `.s1mple/docs/project.md` and `.s1mple/docs/languages/typescript.md`.

**Depends On:** None

## W261003HEGE-REQ3@R1: Recorded Neovim expectations

**Requirement ID:** `W261003HEGE-REQ3`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How are V2's expected Neovim results produced and kept?

**Answer:** A committed recorder script runs Neovim 0.11.x with `--clean --headless` over the case inputs and writes the expected text, cursor, mode, and register values to a committed fixture file. The script refuses to run with any Neovim other than 0.11.x. `bun test` reads only the committed fixture, so CI and `bun run check` never need Neovim. Adding a case means adding its input and re-running the recorder.

**Rationale:** V2@R1 requires expected values recorded from Neovim 0.11 `--clean`; a recorder makes that claim provable and repeatable, and committing the output keeps tests pure, fast, and offline. Rejected: running Neovim live in CI (slower, adds a CI dependency, and risks the 3 min budget) and hand-writing expectations (cannot prove Neovim equality, which is the point of S2).

```text
test/vim/cases.ts (inputs) ─► scripts/record-vim.ts ─► nvim 0.11 --clean --headless ─► test/vim/expected.json (committed)
bun test ─► handleKey(cases) == expected.json
```

**Acceptance Criteria:**

- [ ] Running the recorder with Neovim 0.12 exits non-zero with a version message.
- [ ] Every V2 case in `bun test` compares against values in the committed fixture, and the fixture records the Neovim version that produced it.
- [ ] Neither `bun run check` nor CI invokes Neovim.

**Depends On:** None

## W261003HEGE-REQ4@R1: Test layers, platforms, and PTY tooling

**Requirement ID:** `W261003HEGE-REQ4`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** Which test layers run where, and how does V17 observe terminal state?

**Answer:**

- `bun run check` runs format, lint, typecheck, dead-code, the boundary test, and unit tests.
- The CI `test` job runs component, integration, and e2e tests on both `ubuntu` and `macos` runners, so V1's recursive `fs.watch` and V17's restore are proven on both platforms.
- Benchmarks run only on one pinned Linux runner image with the median-of-5, 2× gate.
- V17 spawns `so` in a real pseudo-terminal using Bun's built-in PTY support and feeds the output to a headless terminal emulator. Any terminal mode the emulator cannot report is asserted from the raw output stream: the last set and reset sequences for the alternate screen, cursor visibility, mouse, and kitty keyboard.
- A native PTY add-on is used only if research shows Bun has no PTY support at the pinned version.

**Rationale:** The parent requires `fs.watch` confirmation and restore on macOS and Linux, and only running both runners proves it. Bench timing needs a fixed machine type (REQ9@R2), so it stays on one runner. Built-in PTY support avoids a native dependency, which keeps installs and the release lean. Rejected: Linux-only CI (macOS `fs.watch` would go unproven) and running benchmarks on both platforms (noisier and slower, and REQ9 asks for one fixed runner type).

```text
CI:  check (ubuntu) ∥ test[ubuntu, macos] (component, integration, e2e) ∥ bench (ubuntu, pinned image)
```

**Acceptance Criteria:**

- [ ] V1 and V17 pass on both `ubuntu` and `macos` runners in the same CI run.
- [ ] Benchmarks run on a pinned Linux runner image, fail when the median of 5 runs exceeds 2× the target, and cover source-view keystroke and open on the 5,000-line fixture.
- [ ] V17 asserts the main screen, a visible cursor, mouse modes off, and the kitty keyboard mode off after `:q`, `SIGTERM`, `SIGINT`, and an injected uncaught exception, and asserts no colour SGR codes when `NO_COLOR=1`.
- [ ] CI wall-clock time stays under 3 min, and `bun run check` under 30 s on the reference machine (V14).

**Depends On:** W261003HEGE-REQ2@R1

## W261003HEGE-REQ5@R1: Quit and close with unsaved buffers

**Requirement ID:** `W261003HEGE-REQ5`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** What do `:q`, `:wq`, `:q!`, `:bd`, signals, and crashes do with dirty, conflicted, or failing buffers?

**Answer:**

- **`:q` (last window), `:wq`, and `:bd`:** first flush every pending save of the affected buffers through `atomicWrite`, then close or exit only when all writes succeed.
  - A failed write keeps `so` open and shows `save failed: <reason>`.
  - A buffer in an unresolved conflict, or dirty and deleted on disk (REQ6), blocks the command with `E37: No write since last change` plus the path. Nothing is written over the disk version.
- **`:q!` and `:bd!`:** discard unsaved edits without writing, as in vim.
- **`:q` with other windows open:** closes only the window; the buffer stays open.
- **`SIGTERM`, `SIGHUP`, and an uncaught exception:** best-effort flush of dirty buffers that are not in conflict, bounded to 2 s, then restore the terminal and exit (code 0 for signals, 1 for exceptions). After the bound, `so` exits anyway and prints the paths of unsaved buffers to stderr.
- **`SIGINT` from outside the terminal:** treated like `SIGTERM`. `Ctrl-C` typed in the terminal is a key, not a signal.

**Rationale:** Autosave already writes on exit (RM261003ABZP-REQ1@R3), so `:q` must flush before exiting. Following vim's `!` convention keeps an explicit way to discard edits. Blocking on conflicts keeps S1's "never silently overwrite" promise even while quitting. The crash flush is safe because the store only ever holds complete immutable snapshots: `update` keeps the previous state on error, so the last committed state is consistent. `atomicWrite` means a flush interrupted by the bound still leaves complete old or new files. Rejected:

- Exiting without flushing on `:q` would lose up to 1 s of typing.
- Writing recovery files instead of the user's files would write outside the workspace's own files, so it is deferred.

```text
:q ─► dirty? ─► flush ─► ok ─► exit 0
                   └─► fail ─► stay, "save failed: EACCES"
     conflict? ─► "E37: No write since last change (notes/plan.md)"   :q! ─► exit 0, nothing written
SIGTERM ─► flush (≤ 2 s) ─► restore ─► exit 0
```

**Acceptance Criteria:**

- [ ] Typing and then `:q` within 1 s leaves the new text on disk and exits 0.
- [ ] `:q` on a buffer whose write fails (read-only directory) leaves `so` running with `save failed: <reason>`.
- [ ] `:q` with a conflicted buffer shows `E37` with the path, and the disk file and the buffer are unchanged.
- [ ] `:q!` after edits exits without writing; the file's bytes are unchanged.
- [ ] `SIGTERM` after an edit leaves the new text on disk and the terminal restored; a flush blocked past 2 s still restores and exits.

**Depends On:** W261003HEGE-REQ1@R1

## W261003HEGE-REQ6@R1: Open file deleted or moved outside so

**Requirement ID:** `W261003HEGE-REQ6`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** What happens to an open buffer when its file is deleted, or moved away, outside `so`?

**Answer:** The buffer stays open with its text and is marked deleted on disk. The message line shows `deleted on disk — :w to recreate`, and autosave does not recreate the file.

- **Buffer was clean:** it stays clean. `:q` and `:bd` close it without writing, and the file stays deleted, as in vim.
- **Buffer was dirty:** the deletion blocks `:q` and `:bd` (REQ5) until the user runs `:w` (recreate) or `:q!`/`:bd!` (discard).
- **File reappears** (for example `git checkout`): the normal watcher rules apply — reload if clean, conflict if dirty.
- An external move is a deletion of the old path; `so` does not follow it.

**Rationale:** Autosave must not resurrect files the user removed on purpose (`git checkout`, `rm`), and it must not lose unsaved edits either. Vim keeps the buffer and lets `:w` recreate the file; matching that keeps vim muscle memory. Rejected: closing the buffer (loses dirty edits; this is Obsidian's behaviour but conflicts with S1), and letting autosave recreate the file (surprising resurrection).

**Acceptance Criteria:**

- [ ] Deleting the file of a clean open buffer shows `deleted on disk — :w to recreate`, emits no write within 5 s, and `:q` exits leaving the file absent.
- [ ] Deleting the file of a dirty buffer blocks `:q` with E37; `:w` recreates the file with the buffer text, BOM, and EOL.
- [ ] Recreating the file externally for a clean, deleted-on-disk buffer reloads it (undoable).

**Depends On:** W261003HEGE-REQ5@R1

## W261003HEGE-REQ7@R1: System clipboard provider chain

**Requirement ID:** `W261003HEGE-REQ7`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How does the `"+` register reach the system clipboard?

**Answer:** Through the first available provider, detected once at startup, in Neovim's order:

1. macOS: `pbcopy` and `pbpaste`.
2. Linux Wayland (`WAYLAND_DISPLAY` set): `wl-copy` and `wl-paste`.
3. Linux X11 (`DISPLAY` set): `xclip`, then `xsel`.
4. Otherwise: OSC 52 through the terminal for copy only.

With no read provider, pasting from `"+` returns the last text this session yanked into `"+`. A provider failure shows `clipboard unavailable` and falls back to the internal register. The unnamed register never touches the system clipboard unless the user yanks with `"+`.

**Rationale:** Platform commands are what Neovim uses and they work without terminal support. OSC 52 covers SSH sessions, where no local command exists. Reading via OSC 52 is unsupported or blocked by many terminals, so copy-only is the reliable baseline. Rejected: OSC 52 only (paste would break in most terminals) and commands only (yank to the clipboard would break over SSH).

**Acceptance Criteria:**

- [ ] With a stub `pbcopy` on `PATH`, `"+yy` sends the line to it; `"+p` pastes `pbpaste` output.
- [ ] With no provider, `"+yy` emits an OSC 52 sequence carrying the base64 text, and `"+p` pastes the same text.
- [ ] A failing provider shows `clipboard unavailable`, and the editor state stays valid.

**Depends On:** W261003HEGE-REQ1@R1

## W261003HEGE-REQ8@R1: Trash mechanics per platform

**Requirement ID:** `W261003HEGE-REQ8`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How does explorer delete move items to the trash on each platform, and when does the typed-confirm fallback apply?

**Answer:**

- **Linux:** `so` implements the freedesktop Trash specification 1.0 home trash itself. It moves the item to `$XDG_DATA_HOME/Trash/files/` (default `~/.local/share/Trash`), writes a matching `info/<name>.trashinfo` with `Path` and `DeletionDate`, and picks a unique name on collision.
- **macOS:** `so` uses `/usr/bin/trash` when present (macOS 15 and later). Otherwise it asks Finder through `osascript`.
- **Fallback:** if the trash is unavailable or fails — a different device on Linux, a denied Finder automation permission, or a command error — delete asks for the typed name and then deletes permanently. Startup reports availability through the `trashAvailable` action.

**Rationale:** The home trash is the parent's acceptance target. The spec is small and implementing it avoids depending on `gio`, which is missing on minimal systems. On macOS, `/usr/bin/trash` uses the system API without the Finder automation prompt; Finder covers older macOS. The typed confirmation keeps permanent deletion deliberate (UDES7@R2). Rejected: `gio trash` only (an extra runtime dependency on Linux) and Finder only (prompts for automation permission on every new terminal app).

**Acceptance Criteria:**

- [ ] On Linux, `d` → `y` on `draft.md` leaves `~/.local/share/Trash/files/draft.md` and a `.trashinfo` with the original absolute path, URL-encoded as the spec requires.
- [ ] A second trashed `draft.md` gets a unique name, and neither entry is overwritten.
- [ ] When the trash is unavailable, `Enter` is ignored until the exact name is typed (UV6@R2), and then the item is deleted.
- [ ] The macOS path is checked manually and recorded in the DI1 PR (the phase file's Finder confirmation).

**Depends On:** W261003HEGE-REQ1@R1

## W261003HEGE-REQ9@R1: Workspace exclusion rules

**Requirement ID:** `W261003HEGE-REQ9`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** Exactly which entries does the explorer hide, and from which ignore files?

**Answer:**

- **Always hidden:** entries whose name starts with `.` (files and folders) and folders named `node_modules`.
- **Ignored:** entries matched by `.gitignore` files at the workspace root and in any visited subfolder, with git's pattern semantics (nested files apply to their own subtree; negation works).
- **Single rule:** one exclusion module in the workspace layer, so DI2's worker reuses the same rule.
- **Still openable:** hidden or ignored files still open by path (`:e .env`) under the normal open policy.
- **Symlinks:** shown as entries; a symlinked folder expands lazily like any folder and is never followed during watching.

**Rationale:** The parent names `.git`, `.obsidian`, and `node_modules` and `.gitignore` matches. Treating every dot-entry as hidden matches Unix convention and Obsidian. Honouring nested `.gitignore` files makes code repositories look right, which the language-neutral scope needs. Lazy expansion means symlink loops cannot hang the explorer. Rejected: root `.gitignore` only (wrong in repositories with nested ignore files) and calling `git check-ignore` (needs Git, which the design excludes).

**Acceptance Criteria:**

- [ ] In a fixture with `.git/`, `.obsidian/`, `.env`, `node_modules/`, `build/` (root `.gitignore`), and `pkg/dist/` (`pkg/.gitignore`), the explorer lists none of them.
- [ ] A `!keep.log` negation after `*.log` shows `keep.log`.
- [ ] `:e .env` opens the file.
- [ ] A symlink loop does not hang the explorer.

**Depends On:** W261003HEGE-REQ1@R1

## W261003HEGE-REQ10@R1: Safe explorer operations and open buffers

**Requirement ID:** `W261003HEGE-REQ10`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How do create, rename, move, and delete behave when the target exists or the item is open in a buffer?

**Answer:**

- **No overwrite:** create, rename, and move never overwrite an existing entry. They fail with `E13: File exists (<path>)` and change nothing. Create uses an exclusive create.
- **Rename and move:**
  - The open buffers of a renamed or moved file, or of files under a renamed or moved folder, keep their text, dirty state, and undo history, and switch to the new path.
  - Pending saves are flushed before the move, so the next save writes to the new path.
- **Delete:**
  - Pending saves of affected buffers are flushed first, so the trashed copy holds the latest text.
  - The buffers then close.
  - On the typed-confirm permanent-delete path, unsaved edits are discarded as part of the confirmed deletion.
- **Folders:** creating `name/` makes a folder; a name without an extension gets `.md` (UDES7@R2); missing parent folders in a typed path (`a projects/new/idea`) are created.

**Rationale:** Explorer operations are the most common way to lose files, so the explorer must never overwrite. Moving buffers with their files keeps the editor consistent with the disk without extra prompts. Flushing before trash means nothing typed is lost even when deleting, because the edits are in the trash. Rejected: prompting to overwrite (a new destructive path that the accepted prompts don't have) and closing buffers on rename (loses undo history).

**Acceptance Criteria:**

- [ ] Renaming `a.md` to an existing `b.md` shows `E13` and both files are unchanged.
- [ ] Renaming an open dirty `a.md` to `c.md` keeps the buffer dirty with its undo history, the bufferline shows `c.md`, and the next save writes `c.md` and leaves no `a.md`.
- [ ] Trashing an open buffer with typed-but-unsaved text puts the new text in the trash copy, and the buffer closes.
- [ ] `a projects/new/idea` creates `projects/new/idea.md`.

**Depends On:** W261003HEGE-REQ8@R1, W261003HEGE-REQ9@R1

## W261003HEGE-REQ11@R1: Recognized languages and file types

**Requirement ID:** `W261003HEGE-REQ11`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** Which languages get syntax colouring in DI1, and how are files matched to them?

**Answer:**

- **Languages:** DI1 registers one code file type per language in lowlight's `common` grammar set (about 37 languages, including TypeScript, JavaScript, JSON, YAML, TOML through `ini`, shell, Python, CSS, HTML/XML, Makefile, Go, Rust, and Markdown). The exact list is confirmed by research.
- **Mapping:** a static table in `lang/code` maps extensions and file names to each language, for example `Makefile` → `makefile` and `Dockerfile` → `dockerfile` when that grammar is in the set.
- **Markdown:** `.md` maps to the `markdown` file type, source view only, coloured by the `markdown` grammar.
- **Everything else:** files with no match are the plain `text` file type.
- **Extension:** adding a language is one table row or one registration and needs no kernel change.

**Rationale:** The `common` set is lowlight's curated default and covers the parent design's list and V18's cases. A static table keeps matching deterministic and pure, as `forPath` requires. Loading all of highlight.js (190+ grammars) would grow the binary and startup for languages that notes folders rarely hold. Rejected: a hand-picked list of about 10 languages (misses common config formats) and all grammars (cost without demand).

**Acceptance Criteria:**

- [ ] V18(a): `.ts` and `.yaml` lines carry highlighter style tokens, `notes.txt` resolves to `text`, and `Makefile` resolves to `makefile`.
- [ ] `.md` resolves to `markdown` with exactly one view, `source`.
- [ ] A unit test asserts that every registered language id exists in the bundled grammar set, and that no two file types claim the same extension or file name.

**Depends On:** W261003HEGE-REQ1@R1

# 6. Research Impact Review

None yet — the research assessment follows this baseline commit.

# 7. Historical Requirement Revisions

None — no requirement has been revised or replaced.
