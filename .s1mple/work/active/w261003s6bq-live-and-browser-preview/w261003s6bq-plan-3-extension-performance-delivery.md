# W261003S6BQ Plan Part 3 — Extension, Performance, and Delivery

## Status

`Ready`

## Objective

This part proves and delivers the integrated DI3 work:

- **Registration-only extension:** a `csv` file type with a view input and view-context builder, and a `grid` editor kind plus a block renderer and widget painter, all work by registration only. This proves the G4 outputs.
- **Benchmarks:** four bench targets join the 2× CI gate.
- **Compiled binary:** it serves the page and the embedded KaTeX and Mermaid without `node_modules`.
- **Manual page check:** the UV9@R2 checklist is recorded.
- **Delivery:** the PR is opened with CI green, the work folder is moved to `work/done/`, and CI is green again on the new head. Nothing is merged without the user's approval, and no release or tag is made.

## Coverage Summary

- **System Design:** `REQ1@R1, REQ3@R1, REQ6@R1, REQ7@R3 → DES1, DES2, DES3, DES6, DES12, DES14 → S13, S15, S16, S18 → V35, V38, V41, V42, V44, V45, V46, V47`
- **UI Design:** `Not applicable — the parent RM261003ABZP-US8@R1/UV9@R2 manual checklist (V42) is carried through the system design's "UI obligations" row.`

## Sources

- Plan index: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-index.md`
- Plan context: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-context.md`
- System design: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-system-design.md`
- UI design: Not applicable — no W UI design. The parent UV9@R2 at `rm261003abzp-ui-design.md` defines the manual checklist that V42 runs.
- System requirements: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-requirements.md`
- UI requirements: Not applicable — no W UI requirements. The parent UREQs are bound through the discussion context.

## Dependencies

- Parts 1 and 2, completed and verified. Part 3 consumes:
  - `registerBlockRenderer`, `registerWidgetPainter`, and `ViewContextRegistry` (P1-G1-T3, P1-G2-T4, P1-G1-T7);
  - `testRegistries` and `mountShell` with `capabilities` and `files` (P1-G3-T4);
  - `PAGE`, `ASSETS`, and `:Preview` end to end (P2-G1-T2, P2-G1-T4);
  - the installed `mermaid` version (P2-G1-T2).

## Execution Flow

```text
P3-G1: Extension proof, benchmarks, and delivery
```

## Groups

Every delegated agent (implementer, verifier, remediator) reads and follows `.s1mple/S1MPLE.md` and its required references: `docs/communication.md`, `docs/project.md`, and `docs/languages/typescript.md`. Delegated agents do not use the native `Explore` subagent; they inspect directly.

The user's command to execute the goal includes planned commits, subject to binding project instructions and any limits in the command. Do not request separate permission.

- Commit each task after its checks and self-review pass, and before the next task starts.
- Commit subjects follow Conventional Commits, and each body carries the task ID and its exact plan title.
- Task commits are checkpoints, not group acceptance.
- If a task needs no change, record no-change evidence instead of making an empty commit.

Delivery rules from `.s1mple/S1MPLE.md`:

- Open a PR, make CI pass, and resolve conflicts with `main`.
- Move the work folder from `work/active/` to `work/done/` and update the `.s1mple/` references to it.
- Push again; CI must pass on the new head.
- Never force-push or merge without the user's approval. CI runs only on pull requests. Do not tag, publish, or run a release.

Rules for planned code:

- Use no work-process identifiers in code, comments, identifiers, test names, or log messages.
- This part changes production code only to fix defects that its checks find. Each fix stays within the owning design decision and is reported.

### P3-G1 — Extension proof, benchmarks, and delivery

#### Goal

- **Extension:** the registration-only tests pass without edits to any other git-tracked source.
- **Benchmarks:** the bench gate covers live and source keystrokes, opening, and scrolling.
- **Final checks:** the fast gate, CI suites, compiled-binary check, reference readings, and manual page checklist all pass and are recorded.
- **Delivery:** the PR is green before and after the work-folder move.

#### Coverage Summary

- **System Design:** `REQ1@R1, REQ3@R1, REQ6@R1, REQ7@R3 → DES1, DES2, DES3, DES6, DES12, DES14 → S13, S15, S16, S18 → V35, V38, V41, V42, V44, V45, V46, V47`
- **UI Design:** `Not applicable — parent UV9@R2 manual checklist (V42).`

#### Scope

- Included:
  - `test/ui/extension.test.ts`;
  - `make5000LineTs` moved into `test/fixtures/generate.ts`;
  - `test/bench/{live-keystroke,source-open,scroll}.bench.ts` and the change to `source-keystroke.bench.ts`;
  - `scripts/bench-gate.ts` (`TARGETS`, `BENCHES`);
  - the build, bench, manual, and CI checks;
  - PR delivery and the work-folder move.
- Excluded:
  - new product behaviour;
  - parent roadmap edits under `rm261003abzp-so-v1/`, unless the user explicitly authorizes the parent synchronization;
  - any release or tag.
- Main files:
  - `test/ui/extension.test.ts`;
  - `test/fixtures/generate.ts`, `test/bench/*.bench.ts`, `scripts/bench-gate.ts`;
  - the work folder, which moves to `.s1mple/work/done/w261003s6bq-live-and-browser-preview/`.

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ1, REQ6 → DES1, DES14 → S16 → V38` | None | `csv`, with a highlighter, a view-input provider, a view-context builder, and a scoped keymap, works with no other source edited |
| `REQ1 → DES2, DES6, DES14 → S16, S18 → V41` | None | A command and keymap, a syntax extension, a block renderer and widget painter, and a `grid` editor kind work by registration only |
| `REQ1, REQ3 → DES14, DES2, DES3, DES6 → S15 → V44, V45` | None | All bench medians stay within 2× the targets on Linux CI, including the first frame with `beautiful-mermaid`; reference readings are recorded |
| `REQ1 → DES14 → S15 → V46` | None | `check` under 30 s locally and CI under 3 min on the DI3 PR |
| `REQ7 → DES12 → S13 → V35` | None | The compiled binary serves the page, KaTeX, Mermaid, and fonts with bytes equal to the package files, without `node_modules` |
| `REQ7 → DES12 → S13 → V42` | parent UV9@R2 (manual) | Math and Mermaid render offline; malformed blocks show source; only `127.0.0.1:<port>` requests; no CSP violation; recorded in the PR |
| `REQ1, REQ3, REQ7 → DES1, DES3, DES12 → S16, S18 → V47` | None | `bun run check` passes with the package homes and no Markdown in the kernel or generic editor |

#### Cross-Work Gates

| Gate source | Affected task or group boundary | Required evidence | Integration owner |
|---|---|---|---|
| G4 — DI3 extension points for DI4 (plan context §2; `rm261003abzp-roadmap-phase-2-obsidian-experience.md:71`) | P3-G1-T1 provides the proof. The PR body in P3-G1-T4 carries the evidence. The gate becomes satisfied only when the user merges the DI3 PR, and it is due before DI4 execution of the `![[file.base]]` renderer. | V38 and V41 (the RM261003ABZP-V16@R2 cases) and V4 (the RM261003ABZP-V7@R2 goldens, from P1-G1-T6) pass on the PR head. The signatures equal the phase design at `:205-230`. Report the gate as `Pending` until the merge. | RM261003ABZP-DI4@R2 — W Pending |

#### Tasks

##### P3-G1-T1 — Registration-only extension proof

- **Outcome:** A test module registers both extensions without editing any other git-tracked source:
  - a `csv` file type with a highlighter, a decoration provider that uses a view input, a view-context builder, and a `csv`-scoped keymap;
  - a command and keymap, a syntax extension, a block renderer and widget painter, and a `grid` editor kind with a `.grid` file type and UI view.

  Both paint and run.
- **System Design:** `REQ1@R1, REQ6@R1 → DES1, DES2, DES6, DES14 → S16, S18 → V38, V41`
- **UI Design:** `None`
- **Canonical Shapes:**
  - System design §6 `ViewHost` and `ViewContextBuilder` — Contract;
  - §6 `MarkdownViewInput` and `BlockRenderer` — Contract (G4);
  - §6 `WidgetPainter` — Contract (G4);
  - §7 `src/core/state/view-context.ts`, `src/core/lang/markdown/live-preview.ts`, `src/ui/widgets/registry.ts`.
- **Files:** `test/ui/extension.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V38`, `V41`:** `test/ui/extension.test.ts`. Use the real registries, store, and shell on the OpenTUI test renderer.

   - V38: register the `csv` file type with all four pieces and open `data.csv`. Then:
     - the highlighter marks and the decorations are painted;
     - the scoped key runs the `csv` command;
     - `git status --porcelain -- src` is empty after the test.
   - V41: register the command, keymap, syntax extension, block renderer, widget painter, and `grid` editor kind. Then:
     - the palette and the key both run the command;
     - the syntax renders through the renderer and painter;
     - `t.grid` opens as `{ editor: "grid" }` and the registered view paints.

   **Preview:**

   ```ts
   test("a csv file type works by registration alone", async () => {
     const reg = testRegistries();
     reg.fileTypes.register(csvFileType);           // views: [{ id: "table", decorations: [csvColumns], input: (rows, ctx) => ({ rows, ctx }) }]
     reg.viewContexts.register("csv", (_s, _w, host) => ({ width: host.width }));
     // mountShell with reg; open data.csv; assert painted spans and the scoped command
   });
   test("a block renderer, widget painter, and editor kind extend the editor by registration alone", async () => {
     registerBlockRenderer("xgrid", (b) => [{ kind: "replace", range: wholeBlock(b), block: true, widget: { type: "xgrid", data: {}, rows: 2 } }]);
     registerWidgetPainter("xgrid", (t) => { /* write "GRID" at t.x, t.y */ });
     // editorKinds.register("grid"); registerEditorView("grid", …); open t.grid
   });
   ```

   - Run `bun test test/ui/extension.test.ts`. A failure is expected only if a mounting hook does not yet take a custom registry; any other failure is a real extension defect.

2. **GREEN:** If the RED step exposed a need to edit core or UI code, that is a defect against S16 or S18. Fix it in the owning P1 module, keeping the G4 signatures. Report it as a remediation item, and do not add new extension points. Otherwise make `mountShell` accept a registry override only if it lacks one; that change is test-support only.

   **Preview:**

   ```ts
   // test/support/ui.ts — MountOptions + reg?: Registries (defaults to testRegistries())
   ```

   - No change to `src/` is expected.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   // Prohibited: adding switch cases or special-casing csv/grid anywhere in src/.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   test(extension): prove csv and grid extension by registration only

   Task: P3-G1-T1 — Registration-only extension proof
   ```

   - Record the commit SHA.

**Verification:**

- `V38`, `V41`: `bun test test/ui/extension.test.ts` → pass. `git diff --stat HEAD~1 -- src` is empty unless a reported defect fix was needed.

##### P3-G1-T2 — Live and source bench targets

- **Outcome:**
  - `bun run bench` measures four more targets: `liveKeystrokeP95` 16, `sourceOpenFile` 50, `liveScrollFrameP95` 16.7, and `sourceScrollFrameP95` 16.7.
  - The existing targets keep their names and meanings.
  - The gate rule is unchanged: a median of 5 above 2× fails.
- **System Design:** `REQ1@R1, REQ3@R1 → DES14, DES2, DES3, DES6 → S15 → V44, V45`
- **UI Design:** `None`
- **Canonical Shapes:** System design §7 `scripts/bench-gate.ts` and `test/bench/*` (`TARGETS`, `BENCHES`, `make5000LineTs`)
- **Files:**
  - `test/fixtures/generate.ts` (`make5000LineTs`);
  - `test/bench/source-keystroke.bench.ts`;
  - `test/bench/live-keystroke.bench.ts`, `test/bench/source-open.bench.ts`, `test/bench/scroll.bench.ts`;
  - `scripts/bench-gate.ts` (`TARGETS`, `BENCHES`).
- **Execution Approach:** `Direct verification — benchmarks measure timing rather than assert logic (design §8 Coverage Balance). TDD does not apply.`

**Steps:**

1. `test/fixtures/generate.ts`: move the inline `tsSource` from `source-keystroke.bench.ts` into `make5000LineTs`, and use it in both TypeScript benches.

   **Preview:**

   ```ts
   /** A 5,000-line TypeScript module of small functions. */
   export function make5000LineTs(): string { /* body moved unchanged from source-keystroke.bench.ts */ }
   ```

   - The existing `sourceKeystrokeP95` output stays byte-for-byte the same metric.

2. Add the benches and the gate entries.

   **Preview:**

   ```ts
   // live-keystroke.bench.ts — mirrors source-keystroke on make5000LineNote, 120×40, same key mix; prints liveKeystrokeP95
   // source-open.bench.ts — open the 5,000-line .ts file; prints sourceOpenFile
   // scroll.bench.ts --file note|ts — hold j for 2 s of simulated keys, repeat Ctrl-d/Ctrl-u, time each renderOnce;
   //   prints liveScrollFrameP95 or sourceScrollFrameP95
   export const TARGETS = {
     sourceKeystrokeP95: 16, liveKeystrokeP95: 16,
     openFile: 50, sourceOpenFile: 50,
     liveScrollFrameP95: 16.7, sourceScrollFrameP95: 16.7,
     firstFrame: 200, indexReady: 3000, indexingKeystrokeP95: 16,
   } as const;
   // BENCHES + "test/bench/live-keystroke.bench.ts", "test/bench/source-open.bench.ts",
   //           "test/bench/scroll.bench.ts --file note", "test/bench/scroll.bench.ts --file ts"
   ```

   - knip covers `test/**/*.ts`, so every new file must be reachable as an entry, or report zero findings.

3. **VERIFY — `V44`:**

   **Preview:**

   ```text
   bun run bench
   └── Expect: every median ≤ 2× target (liveKeystrokeP95, sourceKeystrokeP95 < 32; openFile, sourceOpenFile < 100;
       live/sourceScrollFrameP95 < 33.4; firstFrame < 400; indexReady < 6000; indexingKeystrokeP95 < 32); exit 0
   ```

   - Run it locally, and record the medians as the reference-machine readings (V45, targets at 1×). If a target misses, profile it. Fix the cause in the owning P1 module, such as provider caching or the layout count, and report it. Never loosen a target.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   test(bench): gate live and source keystroke, open, and scroll times

   Task: P3-G1-T2 — Live and source bench targets
   ```

   - Record the commit SHA and the medians.

**Verification:**

- `V44`: `bun run bench` → exit 0, with all medians within 2× the targets.
- `V45`: the local medians are recorded for the PR body.

##### P3-G1-T3 — Build, offline page, and fast-gate checks

- **Outcome:**
  - The compiled binary, run from an empty directory, serves `/`, `/assets/katex.min.js`, `/assets/mermaid.min.js`, and `/assets/fonts/KaTeX_Main-Regular.woff2` with bytes equal to the package files. Its size is recorded.
  - The manual UV9@R2 checklist passes and is recorded.
  - `bun run check` and `bun run test:ci` pass on the final code.
- **System Design:** `REQ7@R3, REQ1@R1 → DES12, DES1, DES3 → S13, S16, S18 → V35, V42, V47`
- **UI Design:** `Not applicable — parent UV9@R2 manual checklist.`
- **Canonical Shapes:** System design §8 Non-test verification (V35, V42, V47); §7 `src/preview/assets.ts` …; parent `rm261003abzp-ui-design.md` UV9@R2
- **Files:** None committed. The evidence goes into the group report and the PR body.
- **Execution Approach:** `Direct verification — build, browser, and gate checks that inspect real artifacts. TDD does not apply.`

**Steps:**

1. Build and run the binary from an empty directory.

   **Preview:**

   ```text
   bun run build
   tmp=$(mktemp -d); cp dist/so "$tmp/"; ws=$(mktemp -d); cp test/fixtures/tour.md "$ws/"
   # start "$tmp/so" "$ws/tour.md" under a PTY (test/e2e/pty.ts helper) with a PATH-stubbed open/xdg-open; run :Preview
   curl -s http://127.0.0.1:<port>/assets/katex.min.js | cmp - node_modules/katex/dist/katex.min.js
   # same for mermaid.min.js and fonts/KaTeX_Main-Regular.woff2; GET / → 200
   ```

   - Record `ls -l dist/so` (the binary size) for the PR.

2. **VERIFY — `V35`, `V42`, `V47`:**

   **Preview:**

   ```text
   V35: cmp for each asset
   └── Expect: identical bytes; / is 200 text/html; no node_modules next to the binary
   V42: browser at 1200 px and 375 px, light and dark, network disabled (Playwright MCP with offline emulation, or the user)
   └── Expect: math and Mermaid render; a malformed formula and a malformed diagram show their source with the render-error label;
       network panel lists only 127.0.0.1:<port>; console shows no CSP violation; no page-level horizontal scroll at 375 px
   V47: bun run check ; bun run test:ci
   └── Expect: both pass; boundary test passes with beautiful-mermaid, katex, mermaid homes; no Markdown in src/core/kernel or src/ui/editors
   ```

   - If no browser automation is available, hand the V42 checklist to the user before the PR is merged, and report it as pending user evidence. Do not claim it passed.

3. **COMMIT:** No repository change is expected. Record the evidence in the group report as no-change evidence.

   **Commit message:**

   ```text
   None — build, page, and gate evidence recorded in the P3-G1 group report

   Task: P3-G1-T3 — Build, offline page, and fast-gate checks
   ```

   - If a check exposed a defect, fix it in the owning module. Commit the fix as `fix(<scope>): …` with this task in the body, and re-run all three checks.

**Verification:**

- `V35`: byte-equal assets from the compiled binary; the binary size is recorded.
- `V42`: the checklist is recorded (or pending user evidence, stated explicitly).
- `V47`: `bun run check` and `bun run test:ci` pass.

##### P3-G1-T4 — Delivery

- **Outcome:**
  - The DI3 PR from `feat/rm261003abzp-di3-live-preview` to `main` is open, conflicts with `main` are resolved, and CI is green.
  - The work folder has moved to `.s1mple/work/done/`, the `.s1mple` references are updated, and CI is green again on the new head.
  - The G4 evidence, the bench readings, the binary size, the `mermaid` version, the V42 checklist, and any pending parent synchronization are reported. Nothing is merged.
- **System Design:** `REQ1@R1 → DES14 → S15 → V46 (with V44 on Linux CI)`
- **UI Design:** `None`
- **Canonical Shapes:** `.s1mple/S1MPLE.md` Delivery; system design §7 Migration and Delivery; plan index Roadmap Contract
- **Files:** the work folder, moved from `.s1mple/work/active/` to `.s1mple/work/done/w261003s6bq-live-and-browser-preview/`, and every `.s1mple` file that references the active path
- **Execution Approach:** `Direct verification — delivery steps`

**Steps:**

1. Push the branch and open the PR.

   **Preview:**

   ```text
   git push -u origin feat/rm261003abzp-di3-live-preview
   gh pr create --base main --title "feat: DI3 live and browser preview (W261003S6BQ)" \
     --body "<summary; V results; G4 outputs and V4/V38/V41 evidence; bench medians (CI and reference); binary size;
             mermaid version; V42 checklist; pending parent synchronization>"
   gh pr checks --watch
   ```

   - If `main` has moved, merge `main` locally and resolve the conflicts without force-pushing, then re-run `bun run check` and `bun run test:ci`.
   - If CI fails, fix the cause within the owning group's scope and push again.

2. Move the work folder and update the references.

   **Preview:**

   ```text
   git mv .s1mple/work/active/w261003s6bq-live-and-browser-preview .s1mple/work/done/
   rg -l "work/active/w261003s6bq" .s1mple   → update each to work/done/…
   ```

   - Do not edit the parent roadmap files under `rm261003abzp-so-v1/` unless the user explicitly authorizes the parent synchronization. Otherwise report the exact pending updates: the DI3 Delivery Items PR column, the Work Progress row stage, and the phase Progress row.

3. **COMMIT:** Commit the folder move and the reference updates before pushing in step 4.

   **Commit message:**

   ```text
   chore(s1mple): move W261003S6BQ work folder to done

   Task: P3-G1-T4 — Delivery
   ```

   - Never force-push, and never merge without the user's approval. Do not tag or release.

4. **VERIFY — `V46` and CI on the new head:**

   **Preview:**

   ```text
   git push ; gh pr checks --watch
   └── Expect: check, test:ci, and bench green on the new head; CI wall time < 3 min; local check < 30 s
   ```

   - Capture the run URLs, the CI bench medians (V44), and the timings (V46) for the report.

**Verification:**

- The PR URL, and green CI on the final head (`check`, `test:ci`, `bench`).
- `V46`: the local `check` time and the CI wall time are within budget.
- G4: the output paths and symbols plus the V4, V38, and V41 results on the PR head. The gate status stays `Pending` until the user merges.
- Parent synchronization: reported as pending exact updates, unless the user authorizes it.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Passes in < 30 s |
| Full suites | `bun run test:ci` | All component, integration, and e2e suites pass |
| Build | `bun run build` | Main and worker compile; the binary serves the embedded assets (V35) |
| Benchmarks | `bun run bench` (local and Linux CI) | The gate passes; medians recorded |
| Lockfile | `bun install --frozen-lockfile` | Passes |
| PR CI | `gh pr checks` on the final head | All green |

#### Review and Verification Focus

- **Specification:**
  - S16 and S18: the extension needs no source edits, and the G4 signatures are unchanged.
  - S15: the targets are unchanged and the four added ones are gated.
  - S13: the binary works with no `node_modules`, and the page is same-origin only.
  - The Delivery rules: PR, CI, move, re-push, no merge, no release.
- **Technical:**
  - Bench validity: the same key mixes, fresh processes, and medians of 5.
  - Evidence is real, not inferred. V42 is stated as pending if the user must run it.
  - No unrelated files are in the delivery commits.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ1, REQ6 → DES1, DES14 → S16 → V38` | None | P3-G1 | P3-G1-T1 |
| `REQ1 → DES2, DES6, DES14 → S16, S18 → V41` | None | P3-G1 | P3-G1-T1 |
| `REQ1, REQ3 → DES14, DES2, DES3, DES6 → S15 → V44, V45` | None | P3-G1 | P3-G1-T2, P3-G1-T4 (CI medians) |
| `REQ7 → DES12 → S13 → V35` | None | P3-G1 | P3-G1-T3 |
| `REQ7 → DES12 → S13 → V42` | parent UV9@R2 (manual) | P3-G1 | P3-G1-T3 |
| `REQ1, REQ3, REQ7 → DES1, DES3, DES12 → S16, S18 → V47` | None | P3-G1 | P3-G1-T3 |
| `REQ1 → DES14 → S15 → V46` | None | P3-G1 | P3-G1-T4 |
| G4 proof and evidence hand-off | None | P3-G1 | P3-G1-T1, P3-G1-T4 |
| `.s1mple/S1MPLE.md` Delivery | None | P3-G1 | P3-G1-T4 |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary. G4 evidence is on the PR, and the gate is handed off as `Pending` until the user merges; it is then due before DI4 execution.
- Every source obligation is covered.

## Planning Gaps

None.
