# W26100423LX Implementation Plan Index

## Status

`Ready`

## Sources

- Plan context: `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-plan-context.md`
- System design: `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-system-design.md`
- UI design: Not applicable — no work-local UI design; the parent `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-ui-design.md` (`Ready for Planning`) governs the assigned RM261003ABZP-UREQ8@R2, UREQ9@R1, UREQ11@R1 chains, mapped by the system design section 1, Assigned Parent Obligation Coverage, UI obligations
- System requirements: `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-requirements.md`
- UI requirements: Not applicable — parent `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-ui-requirements.md` through the roadmap binding
- Research: `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-research.md`
- Discussion context: `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-discuss-context.md`
- UI context: Not applicable — no work-local UI context; the discussion context and the system design Focused Code Surface carry the UI code evidence

## Roadmap Contract

- **Accepted binding:** `w26100423lx-discuss-context.md`, Roadmap Binding — RM261003ABZP-PH2@R5, RM261003ABZP-DI4@R2; Previous Accepted Bindings: None.
- **Assigned parent coverage:** `w26100423lx-system-design.md` section 1, Assigned Parent Obligation Coverage (lines 227–307): Daily notes and templates, Bases, Language-neutral kernel, UI obligations (M5@R2, M6@R1; UREQ8/9/11, UDES8/9/11, US6/7/9 via UV7/8/10), and Cross-work integration (RM261003ABZP-V7@R2, V12@R3, V16@R2, UV3@R2).
- **Finalization assessment:** Aligned — rechecked 2026-10-04 by the reconciler. `git merge-base HEAD main` is `d398ad7` (`main` unchanged) and `git diff main..HEAD` shows no change under `.s1mple/work/active/rm261003abzp-so-v1/`, `src/`, or `test/`. Index line 134 and phase Progress line 590 still show DI4 Work `Pending` (no duplicate assignment). G3 (phase line 70) and G4 (phase line 71) are satisfied and placed at P1-G2, P2-G1-T3, P2-G2-T1/T5 (G3) and P3-G1-T1/T2 (G4); the phase line 553 integration re-checks are placed at P3-G1-T3/T4 before delivery. Assigned parent coverage (system design lines 227–307) maps to parts 1–3 in Coverage below, with V30 explicitly pending the user's fixture. No relevant parent change, missing coverage, or unsatisfied due gate remains.
- **Cross-work gates:** `w26100423lx-plan-context.md` section 2, Cross-Work Dependency Gates. G3 (DI2 outputs) is satisfied at `9adb285` and is consumed from P1-G2 onward. G4 (DI3 embed registries) is satisfied at `e228bb5` and is consumed by P3-G1, which also owns re-passing RM261003ABZP-V7@R2, V12@R3, V16@R2, and UV3@R2 through V43, V44, and V46.
- **Parent synchronization:** Pending parent synchronization — proposed by the discussion context (Parent Synchronization: index line 7, 134, 145; phase file line 8, 590 — W `Pending` → `W26100423LX`) and the system design (Assigned Parent Obligation Coverage: refinements 1–6 and items 1–3, including Kanban enablement as an open PH2 exit item). Planning adds one wording item: parent RM261003ABZP-UV7@R1 (`rm261003abzp-ui-design.md:2223`) asserts that the new note `garden-plan.md` opens, while approved W26100423LX-REQ5@R1 and the system design create `<title>.md` without slugging (title `Garden plan` → `Garden plan.md`); the plans follow the design, and the proposal is to align UV7@R1's example path. No parent file is edited without explicit authorization.

## Plan Overview

Deliver RM261003ABZP-DI4@R2 by registration on the unchanged kernel, following the system design's Proposed Architecture. Each feature lands bottom-up: pure modules first (`core/time`, `core/features/notes`, `core/features/bases`, `frontmatter-patch`), then `core/state` behavior, `src/app`/`src/workspace` adapters, UI painters, and composition in `main.ts` and `testRegistries`. Every file write stays on the serial effect queue, `.base` files are never written, and `KANBAN_TYPE` stays `undefined` until the user supplies the Obsidian fixture (V30 pending).

Plan behavior follows the s1mple-plan defaults (S1MPLE.md Plan: Not established). Implementation stays lean: only the design's registries and seams, no work-process identifiers in code, comments, test names, or logs. Verification uses the design's section 8 tree with `bun run check`, `bun run test:ci`, and `bun run bench`; perf regressions get quick speedups or a threshold-relaxation proposal rather than blocking. Delivery opens a PR, makes CI pass, moves the work folder to `work/done/`, updates `.s1mple/` references, and pushes again — never force-push, merge, tag, or release without the user's approval. Every delegated agent reads and follows `.s1mple/S1MPLE.md` and kills any process it starts.

Shared contract files (`src/core/state/types.ts`, `update.ts`, `src/app/effects.ts`, `src/app/main.ts`, `test/support/state.ts`) are touched by several groups; each group adds only its own variants and registrations, and the tree type-checks after each group.

## Execution Flow

```text
Plan 1: daily-notes-and-templates → Plan 2: bases → Plan 3: base-embeds-and-delivery
```

## Plan Parts

| Part | File | Scope | Dependencies | System design | UI design | Verification focus |
|---|---|---|---|---|---|---|
| 1 | `w26100423lx-plan-1-daily-notes-and-templates.md` | Pure time, notes, frontmatter patcher, and config; then exclusive create, `createNote` effect, note commands, calendar, picker `render`, template insert, new-note flow, notes UI, and wiring | None | W26100423LX-REQ1@R2–REQ6@R2 → DES1–DES8 → S1–S10 → V1–V19, V4a; REQ10@R2 → DES8 → S18 → V34, V34b (patcher unit); REQ13@R1 → DES5, DES6 → S24 → V10, V16 | RM261003ABZP-UREQ8@R2 → UDES8@R1 → US6@R1 via UV7@R1; RM261003ABZP-UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1 (calendar, template picker) | Never-overwrite create (V3, V5, V6); Moment fidelity (V11, V12); one-undo template merge (V14, V15); comment-preserving patch (V34); calendar and picker goldens (V10, V16) |
| 2 | `w26100423lx-plan-2-bases.md` | Ported Bases engine, summaries, property types, candidates, view models, index facts; then `base` file type and editor kind, `readOnly` save gate, key routing, base model/commands/write, `patchFrontmatter` effect, `WindowView`/`BaseView`, table and board painters, wiring | 1 | W26100423LX-REQ7@R2–REQ10@R2, REQ12@R1, REQ13@R1 → DES9–DES14 → S11–S17, S19, S22, S24 → V20–V33, V26a, V35–V37, V40–V42, V45 (V30 pending) | RM261003ABZP-UREQ9@R1, UREQ11@R1 → UDES9@R1, UDES11@R1 → US7@R1, US9@R1 via UV8@R1, UV10@R1 | No vim / no `.base` write (V20, V25); stale-write refusal (V36); memo (V42); table and board goldens (V40, V45) |
| 3 | `w26100423lx-plan-3-base-embeds-and-delivery.md` | Embed-model registry, `PreviewCtx.embedModel`, base embed renderer and painter, `followLink`/`goTo` subpath, `tour.md` and bench fixture seeding, full integration re-checks, PR delivery | 1, 2 | W26100423LX-REQ11@R1, REQ13@R1 → DES15, DES16 → S20, S21, S23 → V38, V39, V43, V44, V46; final V20 search and V30 pending report | None assigned — RM261003ABZP-UV3@R2 is a cross-work re-check (not an assigned UREQ chain), carried by V46 | Embed render and open (V38, V39); type/boundary checks (V43); bench (V44); DI3 integration re-checks (V46); CI green |

## Group Layout

| Group | Shared context | Split rule |
|---|---|---|
| `P1-G1` | Pure modules with colocated unit tests: `src/core/time/{format,local}.ts`, `src/core/features/notes/{daily,template}.ts`, `src/core/lang/markdown/frontmatter-patch.ts`, `src/core/config/schema.ts`; checks V1, V4, V4a, V11–V13, V15, V19, V34, V34b | `First group` |
| `P1-G2` | Notes state and I/O: `types.ts` notes variants, `createExclusive`, `createNote` effect, `note-commands.ts`, `calendar.ts`, picker `render`/`templates`/`newNoteTemplates`, `explorer.ts`/`prompt.ts` new-note flow, `ui/overlays/calendar.ts`, shell, `main.ts` and `testRegistries` notes registrations; notes integration and goldens V2, V3, V5–V10, V14, V16–V18 | `Too large` — together with P1-G1 the notes slice exceeds 8 tasks and 15 files; split at the pure-module seam, which shares only exported function contracts. P1-G2 alone still touches about 24 files; it stays whole because a further split would exceed the 5-group limit and every subset shares the same state contracts (`types.ts`, `update.ts`, `effects.ts`, `main.ts`, `test/support/state.ts`) |
| `P2-G1` | Pure Bases engine and index facts: `src/core/features/bases/*`, `features/links/{summarize,note-index}.ts`, `workspace/index-worker.ts`, `workspace/property-types.ts`, `readPropertyTypes` effect, `IndexState.types`, `PACKAGE_HOMES.yaml`; checks V21–V24, V26, V26a, V28, V31–V33 | `Different context` — the Bases engine, index facts, and their checks share no files or checks with the notes slice; it consumes only Part 1's exported patcher and `core/time` functions |
| `P2-G2` | Base editor kind and write-back: `filetypes/registry.ts` (`readOnly`, `open` subpath), `update.syncEditorKinds`, `keys.ts`, `save.ts`, `base-{model,commands,write}.ts`, `patchFrontmatter` effect, `ui/editors/{registry,base-view}.ts`, `ui/widgets/base.ts` table/board painters, wiring; checks V20, V25, V27, V29, V35–V37, V40–V42, V45; V30 recorded pending | `Too large` — the Bases slice exceeds 8 tasks and 15 files; split at the pure-engine seam, which shares only `features/bases` exports. P2-G2 alone still touches about 22 files; it stays whole because a further split would exceed the 5-group limit and every subset shares the same state contracts (`types.ts`, `update.ts`, `effects.ts`, `main.ts`, `test/support/state.ts`) |
| `P3-G1` | Embeds, integration, and delivery: `embed-models.ts`, `live-preview.ts` `PreviewCtx.embedModel`, `markdown-view.ts`, `embeds.ts`, `features/bases/embed.ts`, `link-commands.ts`/`jumps.ts` subpath, embed painter, `tour.md`, `test/fixtures/generate.ts`, `live-keystroke.bench.ts`, full check/test/bench, PR, CI, work-folder move; checks V38, V39, V43, V44, V46 | `Checkpoint` — the G4 integration re-checks and delivery must run against verified notes and Bases work |

## Cross-Part Coordination

| Boundary | Producing part | Consuming part | Coordination requirement |
|---|---|---|---|
| `patchFrontmatter`, `frontmatterValue`, `yamlScalar` in `frontmatter-patch.ts` | 1 | 2 | Bases write-back uses the P1 patcher unchanged; signatures per system design §7 |
| `localDateTime`, `formatDate` | 1 | 2 | Bases date fields and summaries reuse `core/time` without a second formatter |
| `types.ts` `Action`/`Effect`/`WindowState`/`IndexState` additions | 1, 2 | 2, 3 | Each group adds only its own variants; tree type-checks after each group |
| `src/app/effects.ts` serial-queue cases | 1 (`createNote`), 2 (`patchFrontmatter`, `readPropertyTypes`) | 3 | All writes stay on the serial queue with own-op tracking |
| `registries()` in `main.ts` and `testRegistries` in `test/support/state.ts` | 1, 2, 3 | 2, 3 | Mirrored registrations; `kanban-test` only in test registries |
| `WindowView`, `paintBaseTable`/`paintBaseBoard`, `baseViewModel`, `baseEmbedModel` | 2 | 3 | The embed painter and embed model reuse P2's view model and painters |

## Coverage

| Source item | Covered by parts | Expected outcome |
|---|---|---|
| W26100423LX-REQ1@R2 → DES1–DES4 → S1–S4 → V1–V8, V4a | 1 | Daily notes open or create from template; never overwrite; cursor on first unchecked task |
| W26100423LX-REQ2@R1 → DES4, DES5 → S5 → V9, V10, V40 | 1 (V9, V10), 2 (V40 — the Bases goldens suite, which the design's REQ2 coverage also lists) | Calendar picker with marks; Enter opens or creates |
| W26100423LX-REQ3@R2 → DES1, DES2 → S6, S7 → V11–V13 | 1 | Moment 2.29.4 output; Obsidian-exact expansion |
| W26100423LX-REQ4@R2 → DES2, DES6, DES8 → S8 → V14–V16 | 1 | Template insert with property merge in one undo step |
| W26100423LX-REQ5@R1 → DES3, DES4, DES6 → S9 → V17, V18 | 1 | New note from template; refuses an existing path |
| W26100423LX-REQ6@R2 → DES7 → S10 → V19 | 1 | `[daily]`, `[templates]` defaults and validation |
| W26100423LX-REQ7@R2 → DES9–DES11 → S11–S13 → V20–V25 | 2, 3 (final V20 search) | Ported engine; `base` file type and kind by registration; no vim; no `.base` write |
| W26100423LX-REQ8@R2 → DES9, DES10, DES12, DES14 → S14, S15 → V26–V29, V26a | 2 | Table, summaries, property types, typed cell edit |
| W26100423LX-REQ9@R2 → DES9, DES12, DES13 → S16, S17 → V30–V33 | 2, 3 (V30 pending report) | Kanban model behind `KANBAN_TYPE`; moves write the group property; V30 pending the user fixture |
| W26100423LX-REQ10@R2 → DES8, DES13 → S18, S19 → V34–V37, V34b | 1 (V34, V34b), 2 (V35–V37) | One-key comment-preserving patches; stale writes refused |
| W26100423LX-REQ11@R1 → DES15 → S20, S21 → V38, V39 | 3 | `![[x.base#View]]` renders inline; Enter opens the view |
| W26100423LX-REQ12@R1 → DES11, DES12 → S22 → V41, V42 | 2 | Waiting state, re-evaluation keeping focus, memo, restore |
| W26100423LX-REQ13@R1 → DES5, DES14, DES16 → S23, S24 → V40, V43–V46 | 1 (S24 calendar and picker goldens V10, V16), 2 (V40, V45), 3 (V43, V44, V46) | Wiring, boundaries, goldens, bench, integration re-checks |
| RM261003ABZP-UREQ8@R2 → UDES8@R1 → US6@R1 via UV7@R1 | 1 | Calendar and template picker per M5@R2 in NO_COLOR, light, 80×24 (V10, V16) |
| RM261003ABZP-UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1 | 2 | Base table and Kanban board per M6@R1 with focused cell/card and visible write-back (V27, V29, V36, V40, V45) |
| RM261003ABZP-UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1 | 1, 2 | Every DI4 surface (calendar, template picker, table, board) legible in NO_COLOR, light, and 80×24 (V10, V16, V40, V45) |
| G3 — DI2 outputs (satisfied `9adb285`) | 1, 2 | Picker preview, Prompt, NoteIndex, FileTypeRegistry, `editorViews`, `write` effect consumed unchanged |
| G4 — DI3 embed registries (satisfied `e228bb5`); re-pass RM261003ABZP-V7@R2, V12@R3, V16@R2, UV3@R2 | 3 | V43, V44, V46 pass on the integrated branch |
| No `.base` write; `KANBAN_TYPE` undefined; no expression widening; no kernel change | 2, 3 | V20 search empty; save gate refuses `readOnly` buffers |
| `src/core` purity, package homes, exact pins, no new dependency | 1, 2, 3 | `test/boundaries.test.ts` passes; `package.json`/`bun.lock` unchanged |
| No work-process identifiers in code | 1, 2, 3 | Test names and logs describe behavior only |
| Delivery: PR, CI green, work folder to `work/done/`, push; no force-push, merge, tag, or release without approval | 3 | PR open with green CI on the final head |

## Overall Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast suite | `bun run check` | Passes in under 30 s |
| Full suite | `bun run test:ci` | Passes, including integration, goldens, `test/ui/extension.test.ts`, and boundaries |
| Benchmark | `bun run bench` (after checking for orphan processes) | `liveKeystrokeP95` within 2× of 24 ms with the base embed evaluated |
| `.base` isolation | `rg -n '\.base\b' src/core/kernel src/core/state src/ui src/app -g '!*.test.ts'` | No match (V20) |
| Dependencies | `git diff main -- package.json bun.lock` | No change |
| CI | GitHub Actions on the PR | `check` and `test` green on ubuntu-24.04 and macos-15 |
| Kanban fixture | V30 | Recorded `Pending — user fixture`; `KANBAN_TYPE` remains `undefined` |

## Completion Criteria

- Every listed plan part is implemented and verified.
- Every system and applicable UI design chain and binding constraint has complete coverage.
- Cross-part coordination is integrated and verified.
- For roadmap-linked work, assigned parent obligations and cross-work checks have actual evidence, and all gates due within this execution scope are satisfied. Report later delivery gates separately; do not infer roadmap delivery from work completion.
- All overall verification checks pass.

## Planning Gaps

None.
