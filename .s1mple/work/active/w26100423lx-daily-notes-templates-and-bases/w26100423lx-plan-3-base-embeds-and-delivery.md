# W26100423LX Plan Part 3 — Base Embeds and Delivery

## Status

`Ready`

## Objective

This part finishes and delivers RM261003ABZP-DI4@R2:

- **Base embeds:** `![[x.base]]` and `![[x.base#View]]` render read-only inside notes in live and reading views, capped at `embedMaxRows` with `↓ N more`, with loading and missing states; `Enter` on the embed opens the base at that view; the browser preview still shows a link.
- **Integration re-checks:** the DI3 obligations this work owns pass again with the `base` renderer and a Base embed — RM261003ABZP-V7@R2 (live-preview goldens, via V46), RM261003ABZP-V12@R3 (benchmarks, via V44), RM261003ABZP-V16@R2 (registration-only extension suite, via V43), and RM261003ABZP-UV3@R2 (`tour.md` with a Base embed, via V46).
- **Final checks:** the fast gate, the full suites, the boundary test, the obsolete-reference search, and the bench gate pass and are recorded; V30 is reported as pending the user's Kanban fixture.
- **Delivery:** the PR is opened with CI green, the work folder moves to `work/done/`, and CI is green again on the new head. Nothing is merged, force-pushed, tagged, or released without the user's approval, and no parent roadmap file is edited without explicit authorization.

## Coverage Summary

- **System Design:** `W26100423LX-REQ11@R1, REQ13@R1 → DES15, DES16 → S20, S21, S23 → V38, V39, V43, V44, V46`; delivery reporting of `REQ9@R2 → DES9 → S16 → V30` (pending)
- **UI Design:** `Not applicable — no W UI design; the parent RM261003ABZP-UV3@R2 re-check (tour.md with a Base embed) is carried by V46 per the system design's Cross-work integration obligation.`

## Sources

- Plan index: `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-plan-index.md`
- Plan context: `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-plan-context.md`
- System design: `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-system-design.md`
- UI design: Not applicable — no W UI design. The parent `rm261003abzp-ui-design.md` UV3@R2 is re-checked through V46 (system design §1, Assigned Parent Obligation Coverage, Cross-work integration).
- System requirements: `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-requirements.md`
- UI requirements: Not applicable — no W UI requirements; parent UREQs are bound through the discussion context.

## Dependencies

- Parts 1 and 2, completed and verified. Part 3 consumes:
  - `baseViewModel` and its memo helpers, `Registries.layouts`, `BaseLayoutRegistry.resolve` (P2-G2-T2);
  - `paintBaseTable`, `paintBaseBoard` (P2-G2-T5);
  - `EditorKindSpec.open(…, subpath)`, `WindowState.content.subpath`, the `openPath` `subpath` option, and restore-pending `subpath` (P2-G2-T1);
  - `test/fixtures/workspace/tasks.base` and `tasks/*.md` (P2-G1-T5);
  - `registries()`/`testRegistries` with every notes and base registration (P1-G2, P2-G2).
- Cross-work gate G4 (DI3 embed registries, satisfied at `e228bb5`); see P3-G1 Cross-Work Gates.

## Execution Flow

```text
P3-G1: Base embeds, integration re-checks, and delivery
```

## Groups

Every delegated agent (implementer, verifier, remediator) reads and follows `.s1mple/S1MPLE.md` and its required references: `docs/communication.md`, `docs/project.md`, and `docs/languages/typescript.md`. Delegated agents do not use the native `Explore` subagent; they inspect directly.

The user's command to execute the goal includes planned commits, subject to binding project instructions and any limits in the command. Do not request separate permission.

- Commit each task after its checks and self-review pass, and before the next task starts.
- Commit subjects follow Conventional Commits; each body carries the task ID and its exact plan title.
- Task commits are checkpoints, not group acceptance.
- If a task needs no change, record no-change evidence instead of making an empty commit.

Delivery rules from `.s1mple/S1MPLE.md`:

- Open a PR; make CI pass and resolve conflicts with `main`.
- Move the work folder from `work/active/` to `work/done/` and update the `.s1mple/` references to it.
- Push again; CI must pass on the new head.
- Never force-push or merge without the user's approval. CI runs only on pull requests. Do not tag, publish, or run a release (phase exits use the dry run, which is outside this work).

Rules for planned code:

- No work-process identifiers in code, comments, identifiers, test names, or log messages.
- `lang/markdown` never imports Bases; the base renderer registers from `features/bases`.
- Agents that run benches or PTY tests check for orphan `so`/`bun` processes first and kill every process they start.
- Perf gates do not block development: if `liveKeystrokeP95` exceeds the gate, apply quick, in-scope speedups (memo keys, visible-block rendering); if still over, record the measurement and propose a threshold relaxation to the user instead of stalling.

### P3-G1 — Base embeds, integration re-checks, and delivery

#### Goal

- **Embeds:** a note embedding `tasks.base#Board` loads the base as an unlisted buffer, renders a capped read-only table or board, and opens the base at that view on `Enter`.
- **Re-checks:** `tour.md` goldens, the extension suite, the boundary test, and the bench pass with a Base embed present.
- **Delivery:** the PR is green before and after the work-folder move, with V30 and the pending parent synchronization reported, not hidden.

#### Coverage Summary

- **System Design:** `REQ11@R1, REQ13@R1 → DES15, DES16 → S20, S21, S23 → V38, V39, V43, V44, V46`; `REQ9@R2 → DES9 → S16 → V30` (reported pending)
- **UI Design:** `Not applicable — parent UV3@R2 re-check via V46.`

#### Scope

- Included:
  - `src/core/state/embed-models.ts`; `Registries.embedModels`; `PreviewCtx.embedModel`; `markdownViewContextFor(reg)`; `embedTargets`/`syncEmbeds(prev, r, reg)`; `baseEmbedModel` in `base-model.ts`;
  - `src/core/features/bases/embed.ts`; `paintBaseEmbed`; `registerBlockRenderer("base", …)`, `registerWidgetPainter("base", …)`;
  - `goTo`/`awaitLoad` `subpath`, `followLink` passing the subpath for non-Markdown targets;
  - `test/fixtures/tour.md`, `test/ui/live-preview.test.ts` seeding and goldens, `test/fixtures/generate.ts` `make5000LineNote`, `test/bench/live-keystroke.bench.ts` seeding;
  - final checks, PR delivery, and the work-folder move.
- Excluded:
  - new product behavior beyond §7 embed shapes; `renderHtml` changes (the browser preview keeps a link);
  - setting `KANBAN_TYPE` or adding `obsidian-kanban.base` (only the user can supply it);
  - parent roadmap edits under `rm261003abzp-so-v1/` unless the user explicitly authorizes the parent synchronization;
  - any merge, tag, or release.
- Main files: `src/core/state/{embed-models,base-model,embeds,markdown-view,update,jumps,link-commands}.ts`, `src/core/state/embed-models.test.ts`, `src/core/lang/markdown/live-preview.ts`, `src/core/features/bases/{embed,embed.test}.ts`, `src/ui/widgets/base.ts`, `src/app/main.ts`, `test/support/state.ts`, `test/fixtures/{tour.md,generate.ts}`, `test/ui/live-preview.test.ts`, `test/bench/live-keystroke.bench.ts`; the work folder, which moves to `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/`

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ11@R1 → DES15 → S20, S21 → V39` | None | Only `tasks.base` (not a `.csv` without a builder) is read as an embed; `embedModel` answers `loading` then a model; `followLink` → `goTo` with `#Board`, window `kindState.view === "Board"` |
| `REQ11@R1 → DES15 → S20 → V38` | None | Widget `{ type: "base" }` sized header + `embedMaxRows` + 1 with `↓ 20 more`; loading rows `min(10, 3)`; missing and non-model → title + notice; source view shows raw text |
| `REQ13@R1 → DES16 → S23 → V46` | parent `UV3@R2` | `tour.md` goldens at widths 60 and 100 include the Base embed; other elements unchanged (RM261003ABZP-V7@R2) |
| `REQ13@R1 → DES16 → S23 → V44` | None | `liveKeystrokeP95` median within the 2× gate of 24 ms with the embed evaluated; other targets unchanged (RM261003ABZP-V12@R3) |
| `REQ13@R1 → DES16 → S23 → V43` | None | `bun run check` and `bun run test:ci` pass; boundary test with the `yaml` home; `test/ui/extension.test.ts` unchanged and passing (RM261003ABZP-V16@R2); check < 30 s, CI < 3 min |
| `REQ9@R2 → DES9 → S16 → V30` | None | Reported `Pending — user fixture`; `KANBAN_TYPE === undefined` |

#### Cross-Work Gates

| Gate source | Affected task or group boundary | Required evidence | Integration owner |
|---|---|---|---|
| G4 — DI3 embed registries for the base embed (plan context §2; `rm261003abzp-roadmap-phase-2-obsidian-experience.md:71`): `blockRenderers`, `widget` decorations with row reservation, `widgetPainters`, unlisted embed buffers | Before P3-G1-T1 and P3-G1-T2 execution (the `![[file.base]]` renderer); the DI4 PR merges after DI3 | Satisfied — DI3 merged as `e228bb5` (PR #6) with RM261003ABZP-V7@R2 and V16@R2 passing; the implementer confirms `registerBlockRenderer` (`src/core/lang/markdown/live-preview.ts`), `registerWidgetPainter` (`src/ui/widgets/registry.ts`), and unlisted embeds (`src/core/state/embeds.ts:13-90`) exist as cited before editing | RM261003ABZP-DI4@R2 — W26100423LX |
| Phase line 553 — DI4 re-passes RM261003ABZP-V7@R2, V12@R3, V16@R2 with the `base` renderer and UV3@R2 with a Base embed | P3-G1-T3 and P3-G1-T4, before P3-G1-T5 delivery | V46 goldens, V44 bench medians, and V43 (extension suite) pass on the PR head and are quoted in the PR body | RM261003ABZP-DI4@R2 — W26100423LX |

#### Tasks

##### P3-G1-T1 — Embed-model registry and base embed loading

- **Outcome:** a per-file-type `EmbedModelRegistry` answers the new `PreviewCtx.embedModel(path, subpath)`; `syncEmbeds` loads targets whose file type has an embed model as unlisted buffers; `baseEmbedModel` builds a capped model through the `baseViewModel` memo keyed by path and subpath; `followLink` on a non-Markdown target passes the subpath to `goTo`, so the base window opens at that view.
- **System Design:** `REQ11@R1 → DES15 → S20, S21 → V39`
- **UI Design:** `None`
- **Canonical Shapes:** System design §5 Base embed render; §6 `EmbedModelBuilder` / `PreviewCtx.embedModel` — Contract; §7 `src/core/state/embed-models.ts, src/core/lang/markdown/live-preview.ts, src/core/state/markdown-view.ts, src/core/state/embeds.ts, src/core/features/bases/embed.ts, src/core/state/link-commands.ts` (all but `embed.ts`), `src/core/state/base-model.ts` (`baseEmbedModel`), `src/core/state/update.ts, keys.ts, save.ts, buffers.ts, session.ts, jumps.ts` (`goTo`, `awaitLoad`), `src/app/main.ts and test/support/state.ts`
- **Files:** `src/core/state/embed-models.ts` — `EmbedModelBuilder`, `EmbedModelRegistry`; `src/core/state/update.ts` — `Registries.embedModels`, `syncEmbeds(state, r, reg)`; `src/core/lang/markdown/live-preview.ts` — `PreviewCtx.embedModel`; `src/core/state/markdown-view.ts` — `markdownViewContextFor(reg)` with `embedModel`; `src/core/state/embeds.ts` — `embedTargets`, `syncEmbeds`; `src/core/state/base-model.ts` — `baseEmbedModel`; `src/core/state/jumps.ts` — `goTo`, `awaitLoad`; `src/core/state/link-commands.ts` — `followLink`; `src/app/main.ts`, `test/support/state.ts` — `embedModels.register("base", baseEmbedModel)`, `viewContexts.register("markdown", markdownViewContextFor(reg))`; `src/core/state/embed-models.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V39`:** a note embedding `tasks.base#Board` and a `.csv` with no builder; then `followLink` on the embed line.

   **Preview:**

   ```ts
   test("only file types with an embed model are loaded as embeds", () => {
     // effects contain one read { path: "tasks.base", embed: true } and none for data.csv
   });
   test("an embedded base answers loading, then a model", () => { /* ctx.embedModel("tasks.base", "#Board") → "loading" → fileLoaded → model */ });
   test("Enter on a base embed opens the base at that view", () => {
     // followLink → goTo subpath "#Board" → after load, window kindState.view === "Board"
   });
   ```

   - Run `bun test src/core/state/embed-models.test.ts` and confirm failure.

2. **GREEN:** registry, context, loading, model, and navigation per §7.

   **Preview:**

   ```ts
   export type EmbedModelBuilder = (s: AppState, path: string, subpath: string | undefined, reg: Registries) => unknown | "loading" | "missing";
   export class EmbedModelRegistry { register(id: string, b: EmbedModelBuilder): void; has(id: string): boolean; build(id: string, s: AppState, path: string, subpath: string | undefined, reg: Registries): unknown | "loading" | "missing"; }

   // markdown-view.ts, inside markdownViewContextFor(reg)
   embedModel: (path, subpath) => {
     if (own?.embeds?.refused.includes(path)) return "missing";
     const b = bufferForPath(s, path);
     if (b === undefined) return own?.embeds?.requested.includes(path) ? "loading" : "missing";
     return reg.embedModels.build(b.fileType, s, path, subpath, reg);
   },
   ```

   - The `ViewContextBuilder` signature is unchanged (closure over `reg`); `lang/markdown` imports nothing from Bases; note embeds behave as before.

3. **REFACTOR:** Keep `markdownViewContext` as a thin alias only if existing callers need it; otherwise replace call sites.

   **Preview:**

   ```ts
   // allowed: remove the old export once every caller uses markdownViewContextFor; prohibited: Bases imports in lang/markdown
   ```

   - Keep all affected checks passing (knip reports no unused export).

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(bases): load embedded bases through an embed-model registry

   Task: P3-G1-T1 — Embed-model registry and base embed loading
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V39` — `bun test src/core/state/embed-models.test.ts` → all pass
- Existing embeds — `bun test src/core/state test/ui/live-preview.test.ts` → pass unchanged

##### P3-G1-T2 — Base embed renderer and painter

- **Outcome:** `baseEmbedRenderer` (render key `base`) emits a `base` widget sized by `embedMaxRows` for a model, a short loading block, or a title-plus-notice for missing or invalid data; `paintBaseEmbed` reuses the table and board painters read-only with `↓ N more`; both are registered.
- **System Design:** `REQ11@R1 → DES15 → S20 → V38`
- **UI Design:** `None`
- **Canonical Shapes:** System design §5 Base embed render; §7 `src/core/state/embed-models.ts, …, src/core/features/bases/embed.ts, …` (`embed.ts`), `src/ui/editors/registry.ts, …, src/ui/widgets/base.ts` (`paintBaseEmbed`), `src/app/main.ts and test/support/state.ts` (`registerBlockRenderer`, `registerWidgetPainter`)
- **Files:** `src/core/features/bases/embed.ts` — `BaseEmbedModel`, `isBaseEmbedModel`, `baseEmbedRenderer`; `src/core/features/bases/embed.test.ts`; `src/ui/widgets/base.ts` — `paintBaseEmbed`; `src/app/main.ts` — `registerBlockRenderer("base", baseEmbedRenderer)` in `registries()`, `registerWidgetPainter("base", paintBaseEmbed)` in `main()`; `test/support/state.ts` — mirror the block renderer registration
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V38`:** through `livePreview` with a `PreviewCtx` stub whose `embedModel` returns a model (30 rows, `embedMaxRows` 10), `"loading"`, `"missing"`, or a non-model, on the note `![[tasks.base#Board]]` at width 80; and the same note in source view.

   **Preview:**

   ```ts
   test("a base embed is capped at the configured rows with a more marker", () => {
     // widget { type: "base", rows: header + 10 + 1 }; painted text contains "↓ 20 more"
   });
   test("loading, missing, and invalid embeds render safely", () => { /* loading rows 3; missing/non-model → title + notice */ });
   test("source view shows the embed's raw text", () => { /* no widget */ });
   ```

   - Run `bun test src/core/features/bases/embed.test.ts` and confirm failure.

2. **GREEN:** renderer and painter per §7.

   **Preview:**

   ```ts
   export const baseEmbedRenderer: BlockRenderer = (block, v, { doc, ctx }) => {
     // target/section from the embed link → ctx.resolve → ctx.embedModel(path, section)
     // "loading" → widget base rows min(embedMaxRows, 3); "missing" | !isBaseEmbedModel → title + notice
     // model → { kind: "replace", range: wholeBlock, block: true, widget: { type: "base", data: got, rows: got.rows } }
   };
   export function paintBaseEmbed(/* WidgetPainter args */): void { /* paintBaseTable | paintBaseBoard within the rect, read-only, "↓ N more" */ }
   ```

   - A throwing renderer is already caught by `livePreview` (block shows source with `⚠`); `renderHtml` is unchanged.

3. **REFACTOR:** None beyond reusing P2 painter helpers.

   **Preview:**

   ```ts
   // allowed: shared header/row-cap helper; prohibited: a second table painter
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(bases): render base embeds inline in notes

   Task: P3-G1-T2 — Base embed renderer and painter
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V38` — `bun test src/core/features/bases/embed.test.ts` → all pass
- Boundaries — `bun test test/boundaries.test.ts` → passes (`lang/markdown` imports no Bases module)

##### P3-G1-T3 — Tour note and live-keystroke bench with a base embed

- **Outcome:** `tour.md` contains `![[tasks.base#All tasks]]`; the live-preview suite seeds `tasks.base`, its notes, and the embed load through `indexBatch` and `fileLoaded` and its goldens include the embed at widths 60 and 100; `make5000LineNote` appends a base embed and writes `tasks.base` beside the note; the live-keystroke bench seeds the index and embed so the embed is evaluated while typing.
- **System Design:** `REQ13@R1 → DES16 → S23 → V46, V44`
- **UI Design:** `Not applicable — parent UV3@R2 re-check via V46.`
- **Canonical Shapes:** System design §4 `test/fixtures/tour.md`, `test/fixtures/generate.ts`, `test/bench/live-keystroke.bench.ts`; §8 V44, V46; plan context §6 (seeding finding, `test/ui/live-preview.test.ts:73-86`)
- **Files:** `test/fixtures/tour.md`; `test/ui/live-preview.test.ts` — `openTour` seeding; its `__snapshots__`; `test/fixtures/generate.ts` — `make5000LineNote`; `test/bench/live-keystroke.bench.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V46`:** add the embed line to `tour.md` and extend `openTour` to dispatch `indexBatch` with `tasks.base` and `tasks/*.md` summaries and `fileLoaded` for `tasks.base`; run the suite and confirm the tour goldens fail only because the Base embed now appears.

   **Preview:**

   ```ts
   function openTour(x: Mounted) {
     x.store.dispatch({ type: "indexBatch", summaries: TASK_SUMMARIES, files: ["tour.md", "so-roadmap.md", "diagram.png", "tasks.base", …TASK_NOTES], done: 0, total: 0 });
     openNote(x, "tour.md", TOUR_MD);
     x.store.dispatch({ type: "fileLoaded", path: "so-roadmap.md", file: textFile(ROADMAP_MD) });
     x.store.dispatch({ type: "fileLoaded", path: "tasks.base", file: textFile(TASKS_BASE) });
   }
   ```

   - Run `bun test test/ui/live-preview.test.ts` and confirm the failures are only the tour goldens' new embed rows.

2. **GREEN:** update the tour goldens after inspecting the diff, and seed the bench.

   **Preview:**

   ```ts
   // generate.ts make5000LineNote: append "\n![[tasks.base#All tasks]]\n" and write tasks.base (+ task notes) beside the note
   // live-keystroke.bench.ts: before keys, dispatch indexBatch for tasks.base and its notes and fileLoaded for tasks.base,
   //   then assert the embed rendered as a model (not "loading"/"missing") before timing
   ```

   - Update snapshots with `bun test test/ui/live-preview.test.ts --update-snapshots` only after confirming every changed line belongs to the embed; all other tour elements stay byte-identical.

3. **REFACTOR:** Share the task-notes fixture between the golden suite and the bench.

   **Preview:**

   ```ts
   // allowed: export TASK_SUMMARIES/TASKS_BASE from a test support module; prohibited: changing other bench workloads
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes, including the updated snapshots.

   **Commit message:**

   ```text
   test(bases): add a base embed to the tour and the live keystroke bench

   Task: P3-G1-T3 — Tour note and live-keystroke bench with a base embed
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V46` — `bun test test/ui/live-preview.test.ts` → passes; the snapshot diff shows only the embed rows
- `V44` (local) — check for orphan processes, then `bun run bench` → `liveKeystrokeP95` median within 2× of 24 ms and other targets unchanged; record the medians; kill any process left running. If over the gate, apply quick in-scope speedups or record the numbers and propose a threshold relaxation to the user

##### P3-G1-T4 — Integration re-checks and final verification

- **Outcome:** every final check passes on the integrated branch and its evidence is recorded for the PR: fast gate, full suites (including the unchanged extension suite), boundary test, obsolete-reference search, dependency diff, bench, and V30 status.
- **System Design:** `REQ13@R1 → DES16 → S23 → V43, V44, V46`; `REQ7@R2 → DES11 → S11 → V20`; `REQ9@R2 → DES9 → S16 → V30` (pending)
- **UI Design:** `Not applicable — parent UV3@R2 via V46.`
- **Canonical Shapes:** System design §8 Non-test verification (V20, V30, V43, V44); §7 Migration and Delivery
- **Files:** None expected — production changes only to fix defects these checks find, each within the owning design decision and reported
- **Execution Approach:** `Direct verification — this task runs and records checks; it adds no behavior`

**Steps:**

1. Run the final checks on the branch head.

   **Preview:**

   ```text
   time bun run check                    # biome, tsc, knip, unit suites, boundaries
   bun run test:ci                       # component, integration, PTY e2e (orphan check first; kill started processes)
   bun test test/ui/extension.test.ts    # registration-only suite, unchanged
   rg -n '\.base\b' src/core/kernel src/core/state src/ui src/app -g '!*.test.ts'
   git diff main -- package.json bun.lock .github/workflows
   bun run bench                         # orphan check first
   ```

   - Fix any defect within its owning task's design decision and record the fix.

2. **VERIFY — `V43`, `V44`, `V46`, `V20`, `V30`:**

   **Preview:**

   ```text
   bun run check
   └── Expect: zero findings; boundary test passes with the yaml home; wall time < 30 s
   bun run test:ci
   └── Expect: all pass, including test/ui/extension.test.ts unchanged and the tour goldens with the Base embed
   rg -n '\.base\b' src/core/kernel src/core/state src/ui src/app -g '!*.test.ts'
   └── Expect: no match
   git diff main -- package.json bun.lock .github/workflows
   └── Expect: empty
   bun run bench
   └── Expect: liveKeystrokeP95 median ≤ 48 ms (2× 24); other medians within their gates
   V30
   └── Expect: KANBAN_TYPE === undefined; test/fixtures/bases/README.md slot empty → recorded "Pending — user fixture"
   ```

   - Record each command's result (and the bench medians) for the PR body.

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only fixes this task made, if any.

   **Commit message:**

   ```text
   fix(bases): keep embed models on the memo path
   # example only — the scope and subject name the actual defect found; omit the commit when no fix is needed

   Task: P3-G1-T4 — Integration re-checks and final verification
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence (the command results above) instead.

**Verification:**

- `V43` — `bun run check` and `bun run test:ci` → pass; check < 30 s
- `V44` — `bun run bench` → within gates (or relaxation proposal recorded per the perf rule)
- `V46` — tour goldens pass
- `V20` — search returns no match
- `V30` — recorded `Pending — user fixture`

##### P3-G1-T5 — Pull request delivery and work-folder move

- **Outcome:** the PR from `feat/rm261003abzp-di4-daily-notes-and-bases` to `main` is open with CI green; the work folder is moved to `.s1mple/work/done/` with every `.s1mple/` reference updated; CI is green again on the new head; nothing is merged, force-pushed, tagged, or released.
- **System Design:** `REQ13@R1 → DES16 → S23 → V43` (CI < 3 min on the PR)
- **UI Design:** `None`
- **Canonical Shapes:** `.s1mple/S1MPLE.md` §3 Delivery; `.s1mple/docs/project.md` CI Checks and Release
- **Files:** the work folder `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/` → `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/`; `.s1mple/` files that reference the old path (outside `rm261003abzp-so-v1/`, which needs explicit authorization)
- **Execution Approach:** `Direct verification — delivery steps with external evidence, no product behavior`

**Steps:**

1. Push the branch and open the PR (normal push; resolve any conflict with `main` by merging `main` into the branch; never rebase a pushed branch, because that would require a force-push).

   **Preview:**

   ```text
   git push -u origin feat/rm261003abzp-di4-daily-notes-and-bases
   gh pr create --base main --title "feat: DI4 daily notes, templates, and Bases (W26100423LX)" --body-file "$SCRATCH/pr-body.md"   # body written to the agent's scratchpad, not the repo
   # body: summary per part; V43/V44/V46 evidence from P3-G1-T4 (bench medians, check time, CI time);
   #   G4 re-checks (RM261003ABZP-V7@R2, V12@R3, V16@R2, UV3@R2) passing;
   #   open items: V30 pending the user's Obsidian ≥ 1.14.3 Kanban fixture (KANBAN_TYPE unset; Kanban enablement blocks the PH2 exit;
   #   merging before the fixture is the user's decision); pending parent synchronization proposal (not applied)
   gh pr checks --watch
   ```

   - CI runs only on the PR; wait for `check` and `test` (ubuntu-24.04, macos-15) to pass. Fix failures in new commits; never force-push.

2. Move the work folder and update references, then push again.

   **Preview:**

   ```text
   git mv .s1mple/work/active/w26100423lx-daily-notes-templates-and-bases .s1mple/work/done/
   rg -l "work/active/w26100423lx-daily-notes-templates-and-bases" .s1mple   # update each hit outside rm261003abzp-so-v1/
   # commit per step 4, then: git push ; gh pr checks --watch
   ```

   - Parent files under `rm261003abzp-so-v1/` that mention the path are listed as pending parent-synchronization updates, not edited, unless the user explicitly authorizes them.

3. **VERIFY — `V43`:**

   **Preview:**

   ```text
   gh pr checks
   └── Expect: check and test green on the head after the move; CI wall time < 3 min
   gh pr view --json mergeable,state
   └── Expect: MERGEABLE, OPEN (not merged)
   ```

   - Record the PR URL, final head SHA, and CI run links.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only the folder move and reference updates.

   **Commit message:**

   ```text
   docs: move W26100423LX to done

   Task: P3-G1-T5 — Pull request delivery and work-folder move
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V43` — `gh pr checks` → green before and after the move; CI < 3 min
- Delivery — `gh pr view` → open, not merged; no tag created (`git ls-remote --tags origin` unchanged)

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Embed suites (V38, V39) | `bun test src/core/features/bases/embed.test.ts src/core/state/embed-models.test.ts` | All pass |
| Tour goldens (V46) | `bun test test/ui/live-preview.test.ts` | Pass with the Base embed; other elements unchanged |
| Fast gate (V43) | `bun run check` | Passes in under 30 s |
| Full suites (V43) | `bun run test:ci` (orphan check first; kill started processes) | All pass; `test/ui/extension.test.ts` unchanged |
| Bench (V44) | `bun run bench` (orphan check first) | Within gates, or relaxation proposed per the perf rule |
| `.base` isolation (V20) | `rg -n '\.base\b' src/core/kernel src/core/state src/ui src/app -g '!*.test.ts'` | No match |
| Dependencies and workflows | `git diff main -- package.json bun.lock .github/workflows` | Empty |
| Kanban (V30) | Inspect `KANBAN_TYPE` and `test/fixtures/bases/README.md` | `Pending — user fixture`, reported in the PR |
| CI | `gh pr checks` | Green before and after the work-folder move |
| Delivery limits | `gh pr view`; `git ls-remote --tags origin` | Open, not merged; no new tag |

#### Review and Verification Focus

- **Specification:** read-only, capped embeds with loading/missing states; `Enter` opens the base at the embedded view; browser preview unchanged; DI3 obligations re-passed with the Base embed; V30 and Kanban enablement reported as open; delivery limits respected (no merge, force-push, tag, release, or unauthorized parent edit).
- **Technical:** `lang/markdown` stays Bases-free; embed models share the memo (no per-keystroke re-evaluation, V44); `syncEmbeds` loads only registered file types; snapshot updates limited to embed rows; bench actually evaluates the embed; processes started by checks are killed; reference updates complete after the folder move.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ11@R1 → DES15 → S20, S21 → V39` | None | `P3-G1` | `P3-G1-T1` |
| `REQ11@R1 → DES15 → S20 → V38` | None | `P3-G1` | `P3-G1-T2` |
| `REQ13@R1 → DES16 → S23 → V46` | parent `UV3@R2` | `P3-G1` | `P3-G1-T3`, `P3-G1-T4` |
| `REQ13@R1 → DES16 → S23 → V44` | None | `P3-G1` | `P3-G1-T3`, `P3-G1-T4` |
| `REQ13@R1 → DES16 → S23 → V43` | None | `P3-G1` | `P3-G1-T4`, `P3-G1-T5` |
| `REQ7@R2 → DES11 → S11 → V20` (final search) | None | `P3-G1` | `P3-G1-T4` |
| `REQ9@R2 → DES9 → S16 → V30` (reported pending) | None | `P3-G1` | `P3-G1-T4`, `P3-G1-T5` |
| G4 — DI3 embed registries (satisfied `e228bb5`); phase line 553 re-checks | parent `UV3@R2` | `P3-G1` | `P3-G1-T1`, `P3-G1-T2`, `P3-G1-T3`, `P3-G1-T4` |
| S1MPLE Delivery (PR, CI, folder move, push) | None | `P3-G1` | `P3-G1-T5` |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary; later gates are handed off explicitly.
- Every source obligation is covered.

Handed off after this part (not completed by this work):

- **V30 / Kanban enablement:** pending until the user supplies `test/fixtures/bases/obsidian-kanban.base`; it blocks the PH2 exit, and whether the PR merges first is the user's decision.
- **Parent synchronization:** the W assignment and the design's refinements 1–6 and items 1–3 remain a pending proposal for the main orchestrator; parent files change only with explicit authorization.
- **Merge:** the user approves and performs or authorizes the merge.

## Planning Gaps

None.
