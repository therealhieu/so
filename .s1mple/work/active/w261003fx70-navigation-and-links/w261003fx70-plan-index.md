# W261003FX70 Implementation Plan Index

## Status

`Ready`

## Sources

- Plan context: `.s1mple/work/active/w261003fx70-navigation-and-links/w261003fx70-plan-context.md`
- System design: `.s1mple/work/active/w261003fx70-navigation-and-links/w261003fx70-system-design.md`
- UI design: Not applicable — this Work has no UI design; parent UI obligations are bound through W261003FX70-REQ1@R1 and realized by system design DES9 (V42–V46)
- System requirements: `.s1mple/work/active/w261003fx70-navigation-and-links/w261003fx70-requirements.md`
- UI requirements: Not applicable — parent UREQs are bound through W261003FX70-REQ1@R1
- Research: Not needed — the requirements' Discussion Evidence records the local experiments
- Discussion context: `.s1mple/work/active/w261003fx70-navigation-and-links/w261003fx70-discuss-context.md`
- UI context: Not applicable — no Work-level UI context

## Roadmap Contract

- **Accepted binding:** `w261003fx70-discuss-context.md`, Roadmap Binding — RM261003ABZP-PH1@R2, RM261003ABZP-DI2@R2.
- **Assigned parent coverage:** `w261003fx70-system-design.md`, section 1, Assigned Parent Obligation Coverage.
- **Finalization assessment:** Aligned on 2026-10-03. `git log 2f907fa..1aa1fae -- .s1mple/work/active/rm261003abzp-so-v1/` is empty, so the parent sources are unchanged since the accepted binding. Assigned parent coverage (system design section 1, eight coverage groups) maps to parts as follows:
  - Navigation, commands, configuration and state → Parts 1 and 2.
  - Links, backlinks, tags and rename → Parts 1 and 2.
  - Markdown parse and syntax registration → Part 1.
  - Startup and index performance → Part 3.
  - Overlays and side panel → Part 2.
  - Worker and text search → Parts 2 and 3.
  - UI obligations → Part 2.
  - Cross-work integration and gate outputs → Parts 1–3, with evidence in `P3-G1`.

  No parent obligation is duplicated or missing. Gate placement: G1 is met (`c98aa19`) and is checked before `P1-G1-T1`. G2 and G3 are future gates with named owners (DI3, DI4) and evidence requirements in `P3-G1-T5`; they do not block planning.
- **Cross-work gates:** Plan context section 2, Cross-Work Dependency Gates. G1 (DI1 foundation) is met (`c98aa19`) and is required before Part 1. G2 and G3 are produced by this Work. Their evidence is the merged DI2 PR with RM261003ABZP-V4@R2, V5@R1, V6@R2 and V18@R1 passing, proven here by V8–V15, V22, V38, V39, V42–V44 and V48. It is collected in `P3-G1`.
- **Parent synchronization:** Pending parent synchronization — design section 1, Parent Synchronization, rows 1–9. Parent files are not edited without explicit user authorization.
  - **Plan-stage receipt (2026-10-03):** No parent-write authorization was given. Parent files under `.s1mple/work/active/rm261003abzp-so-v1/` are unchanged since `2f907fa`.
  - **Pending updates:**
    - Design section 1 rows 1–9.
    - The DI2 Work assignment to W261003FX70 and the stage moving from `Not started` to `Planned` (`rm261003abzp-roadmap-index.md:132`, `:143`; `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:627`).
  - **Evidence:** this index and `w261003fx70-goal.md` (`Ready`).

## Plan Overview

DI2 extends the merged DI1 editor additively, following the finalized system design (DES1–DES11). Execution runs in three ordered parts:

```text
Part 1  pure core: protocol, pins, Markdown model, links core, fuzzy, config/keymap, display options
   → Part 2  runtime: index worker + freshness + link-safe edits, then jumps/session + discovery UI
   → Part 3  checkpoint: benches, DI1 re-pass, docs, full verification, delivery
```

Every group follows the `.s1mple/S1MPLE.md` rules:

- **Plan:** the design is the authority; plan previews show only the delta each task owns.
- **Implementation:** keep it lean, with no work-process IDs in code, test names or logs.
- **Verification:** each group ends with `bun run check` passing, plus its owned `test:ci` suites.
- **Delivery:** in `P3-G1`, open the PR, get CI green, move the work folder to `work/done/`, then push again. Never force-push or merge without the user's approval.

`src/app/main.ts` is wired incrementally: each group wires the adapters it adds, so its integration tests run end-to-end. `P3-G1` only confirms the final startup sequence.

## Execution Flow

```text
Plan 1: core-models-and-config → Plan 2: runtime-index-navigation-ui → Plan 3: benches-and-delivery
```

## Plan Parts

| Part | File | Scope | Dependencies | System design | UI design | Verification focus |
|---|---|---|---|---|---|---|
| 1 | `w261003fx70-plan-1-core-models-and-config.md` | `BufferState.analysis` and config protocol additions; seven pins with `PACKAGE_HOMES`; Markdown model; links core; fuzzy ranking; config schema/TOML, effective keymap, leader, `file.save`, config file and log adapters; `editor.*` display options | None (G1 met) | REQ1, REQ2, REQ3, REQ6 (pure planning), REQ7@R2, REQ9 (ranking), REQ10; DES1 (partial), DES2, DES3, DES7, DES11; S1 (partial), S2–S4, S6, S7, S9, S13, S14, S17 (ranking), S19, S21; V1–V19, V20 (except `,ff`), V22 (`:w` case), V31, V33, V35, V39, V55, V57, V58, V59 (except preview) | None | Resolution/rename property tests, block-cache transparency, scan/mdast conformance, config line errors, tab width and wrap |
| 2 | `w261003fx70-plan-2-runtime-index-navigation-ui.md` | Index worker and host, freshness, build/release/knip worker entry, link-safe edits with `applyEdits`; jumps, recents, session and state file; which-key, picker, completion, side panel, statusline, shell and theme | 1 | REQ1, REQ4, REQ5, REQ6, REQ7@R2 (log content, discovery bindings), REQ8, REQ9; DES1 (remaining), DES3 (link-at, commands), DES4, DES5, DES6, DES7 (discovery bindings), DES8, DES9; S1, S7–S12, S14–S18; V20 (`,ff`), V21, V22 (except `:w`), V23–V30, V32, V34, V36–V38, V40–V47, V52 (build), V56, V59 (preview) | None (parent UV4/UV5/UV1/UV6/UV10 via V42–V46) | Worker restart and binary, closed-file span validation, Neovim jump parity, UV4/UV5 component suites |
| 3 | `w261003fx70-plan-3-benches-and-delivery.md` | Bench targets and benches, `makeNoteWorkspace`, final startup wiring, obsolete-reference check, `project.md` update, DI1 re-pass, full checks, PR delivery | 2 | REQ1, REQ3, REQ4; DES10; S5, S20; V48–V54 | None | Budgets (V49–V51), DI1 suites (V48), knip/type/build, CI green on both runners |

## Group Layout

| Group | Shared context | Split rule |
|---|---|---|
| `P1-G1` | `src/core/state/{types,buffers}.ts` (`BufferState.analysis`, `withAnalysis`); `src/ui/editors/text-view.ts` (analysis read from state); `package.json`, `bun.lock`, `test/boundaries.test.ts` `PACKAGE_HOMES`; `src/core/lang/markdown/*`, `state/buffers.ts` `withAnalysis`; `src/core/features/links/*`; `src/core/kernel/text/fuzzy.ts`; Markdown corpus fixtures; V1–V16, V35, V55 | `First group` |
| `P1-G2` | `src/core/config/{schema,toml}.ts`, `state/{config,keymap,keys,commands}.ts`, kernel `commands/{keymap,defaults}.ts`, `vim/{keys,motions,operators,types,engine}.ts`, `kernel/view/wrap.ts`, `src/ui/editors/text-view.ts`, `src/ui/{input,shell,theme}.ts`, `src/workspace/{config-file,log}.ts`, config/log wiring in `main.ts` and `effects.ts`; V17–V19, V20 (except `,ff`), V22 (`:w`), V31, V33, V39, V57, V58, V59 (except preview) | `Too large` — Part 1 as one group exceeds 15 changed files; config, keymap and display options share `ConfigSchema` and the editor view, and share no files with the Markdown/links models |
| `P2-G1` | `src/workspace/index-worker.ts`, `src/app/{index-host,effects}.ts`, `state/{index,link-edits,explorer,save,disk,buffers,status}.ts`, `ui/overlays/prompt.ts`, `ui/views/statusline.ts`, `package.json` build, `release.yml`, `knip.json`, `test/repo.test.ts` worker case; V24, V25 (except outline), V30 (index, backlinks), V34, V36, V37, V38 (rename), V41, V45, V47, V52 (build), V56 | `Ordered phase` — runtime adapters consume the Part 1 protocol, links core and keymap |
| `P2-G2` | `state/{jumps,recent,session,whichkey,picker,completion,side-panel,status}.ts`, `workspace/state-file.ts`, `app/lifecycle.ts`, vim `jumped` effect, `ui/overlays/{whichkey,picker,completion}.ts`, `ui/views/side-panel.ts`, statusline, window-tree, shell, theme, `src/app/{index-host,effects}.ts` (`search`, `readPreview`), `src/core/features/links/{link-at,commands}.ts`, UI fixtures, `test/vim/expected.json`; V20 (`,ff`), V21, V22 (except `:w`), V23, V25 (outline), V26–V29, V30 (jump), V32, V38 (mentions), V40, V42–V44, V46, V59 (preview) | `Too large` — Part 2 as one group exceeds 15 changed files; navigation and discovery share the picker (recents source), statusline (jump indicator) and session state, and the index/link-edit runtime is a separate context |
| `P3-G1` | `scripts/bench-gate.ts`, `test/bench/*`, `test/fixtures/generate.ts`, `src/app/main.ts` startup sequence, `test/repo.test.ts` obsolete-reference case, `.s1mple/docs/project.md`, DI1 suites, PR and work-folder move; V48–V54 | `Checkpoint` — budgets, the DI1 re-pass and delivery require all feature groups verified |

## Cross-Part Coordination

| Boundary | Producing part | Consuming part | Coordination requirement |
|---|---|---|---|
| `AppState`, `Action`, `Effect`, `Overlay`, `TimerId`, `Registries` additions | 1, 2 | 2, 3 | Each group adds the protocol variants it handles; final shapes equal design section 7 `types.ts` |
| `Doc`, `NoteSummary`, `summarize`, `NoteIndex`, `resolveLink`, `linkText`, `planRename`, `linkMentionEdit`, `linkAt` | 1 (`P1-G1`) | 2 | Worker, freshness, link edits and link UI call these pure functions unchanged |
| `fuzzyScore`, `rankBy` | 1 (`P1-G1`) | 2 (`P2-G1` worker search, `P2-G2` picker) | One ranking implementation |
| `ConfigSchema`, `onConfigLoaded`, `keymapFor`, `splitKeys` leader, `defaultBindings`/`defaultGroups`, `file.save` | 1 (`P1-G2`) | 2 (`P2-G2` which-key, palette, help) | Discovery reads the effective keymap only through `keymapFor` |
| `VimEnv.tabWidth`, `wrapLine`/`rowOf`, `EditorView.rows` | 1 (`P1-G2`) | 2 (`P2-G2` preview `paintPreview`, jumps) | Previews reuse the same display options |
| `IndexHost`, `ToWorker`/`FromWorker`, `search` effect, `applyEdits` effect | 2 (`P2-G1`) | 2 (`P2-G2` picker grep, mentions panel), 3 (benches) | Search ids and stale-result dropping stay in `state/picker.ts` |
| `main.ts` wiring | 1, 2 | 3 | Each group wires its own adapters; `P3-G1` confirms the design section 5 startup order |

## Coverage

| Source item | Covered by parts | Expected outcome |
|---|---|---|
| `REQ1@R1` (DES1–DES4, DES6–DES10; S1, S5, S6, S15, S18, S20) | 1, 2, 3 | Every DI2 obligation and G2/G3 output delivered additively; DI1 suites re-pass |
| `REQ2@R1` (DES2, DES7; S13, S19) | 1 | Seven exact pins, each imported only from its home; knip clean |
| `REQ3@R1` (DES2, DES10; S2–S5) | 1, 3 | Two-level Markdown model within budgets |
| `REQ4@R1` (DES4, DES10; S5, S11) | 2, 3 | Worker compiled as a second entrypoint, started after the first frame, restarted once |
| `REQ5@R1` (DES5; S12) | 2 | Saves, explorer operations, link edits and external changes reach the index without a rescan |
| `REQ6@R1` (DES3, DES6; S7–S10) | 1, 2 | Link-safe rename, move and link-mention; validated closed-file writes; refused while indexing |
| `REQ7@R2` (DES7; S13–S15) | 1, 2 | Config file, strict schema, reload, leader, debug log, `editor` table |
| `REQ8@R1` (DES8; S16) | 2 | Neovim-equivalent jumps, MRU recents, session restore, `0600` state file |
| `REQ9@R1` (DES3, DES9; S17) | 1, 2 | fzf v1 ranking, literal debounced capped grep, preview at ≥ 100 columns |
| `REQ10@R1` (DES11; S21) | 1 | `editor.tabWidth`, `editor.wrap`, `editor.relativeNumbers` |
| Assigned parent obligation coverage (design section 1) | 1, 2, 3 | Each of the eight coverage groups has its V evidence |
| Gates G2, G3 | 1, 2, 3 | Required outputs exist; evidence recorded in `P3-G1` |
| Binding constraints (plan context section 3) | 1, 2, 3 | Boundaries, pins, no work-process IDs, `check` < 30 s, delivery rules |
| `.s1mple/docs/project.md` update (design section 4) | 3 (`P3-G1-T3`) | Pins, worker entrypoint, `SO_LOG`, config and state paths, bench targets documented |
| Split V20 | 1 (`P1-G2`), 2 (`P2-G2-T4`) | `P1-G2` covers every case except `,ff`; `P2-G2-T4` covers `,ff` → `file.find` |
| Split V22 | 1 (`P1-G2-T3`), 2 (`P2-G2-T5`) | `P1-G2-T3` covers `:w` → `file.save`; `P2-G2-T5` covers the rest |
| Split V25 | 2 (`P2-G1-T3`, `P2-G2-T6`) | `P2-G1-T3` covers every case except outline; `P2-G2-T6` covers outline |
| Split V30 | 2 (`P2-G1-T3`, `P2-G2-T6`) | `P2-G1-T3` covers the index and backlinks segments; `P2-G2-T6` covers the jump segment |
| Split V38 | 2 (`P2-G1-T5`, `P2-G2-T6`) | `P2-G1-T5` covers the rename cases; `P2-G2-T6` covers the mention cases |
| Split V59 | 1 (`P1-G2-T6`), 2 (`P2-G2-T4`) | `P1-G2-T6` covers every case except the picker preview; `P2-G2-T4` covers the preview |

## Overall Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Passes in < 30 s; Biome, `tsc`, knip and unit suites green |
| Component, integration, e2e | `bun run test:ci` | Green locally and on `ubuntu-24.04` and `macos-15` CI |
| Benchmarks | `bun run bench` (Linux CI) | Medians ≤ 2× targets; PH1 exit evidence below targets |
| Binary build | `bun run build` | Compiles the main entry and the worker |
| Lockfile | `bun install --frozen-lockfile` | Passes |
| Vim recordings | `NVIM=<nvim-0.11.x> bun run record:vim` | V27 cases recorded in `test/vim/expected.json` |
| PR CI | GitHub Actions on the DI2 PR | `check`, `test:ci` matrix and `bench` green on the final head |

## Completion Criteria

- Every listed plan part is implemented and verified.
- Every system design chain and binding constraint has complete coverage.
- Cross-part coordination is integrated and verified.
- Assigned parent obligations and cross-work checks have actual evidence. G1 is satisfied. G2 and G3 outputs exist, and their merge evidence is reported separately, without inferring roadmap delivery from work completion.
- All overall verification checks pass.

## Planning Gaps

None
