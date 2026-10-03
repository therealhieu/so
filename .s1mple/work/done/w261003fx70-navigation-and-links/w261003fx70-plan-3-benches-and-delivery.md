# W261003FX70 Plan Part 3 — Benches and Delivery

## Status

`Ready`

## Objective

Close DI2 with evidence and deliver it as one PR.

- **Benchmarks:** the startup and indexing benchmarks gate the 10,000-note budgets.
- **Obsolete references:** a repository check proves the replaced code is gone.
- **Startup order:** the final `main.ts` order matches the design.
- **Docs:** `.s1mple/docs/project.md` records the new pins, the worker entrypoint, `SO_LOG`, and the config and state paths.
- **DI1 re-pass:** the DI1 suites pass on the DI2 head.
- **Delivery:** the PR passes CI on both runners, then the work folder moves to `work/done/` and CI passes again on the new head.
- **Gates:** G2/G3 output evidence is recorded for the main orchestrator.

## Coverage Summary

- **System Design:** `REQ1, REQ3, REQ4 → DES1, DES10 (+ DES2/DES4/DES7/DES8 docs) → S1, S3, S5, S11, S13, S19, S20, S21 → V48, V49, V50, V51, V52, V53, V54`
- **UI Design:** `None`

## Sources

- Plan index: `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-plan-index.md`
- Plan context: `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-plan-context.md`
- System design: `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-system-design.md`
- UI design: `Not applicable — no Work UI design`
- System requirements: `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-requirements.md`
- UI requirements: `Not applicable — parent UREQs bound through W261003FX70-REQ1@R1`

## Dependencies

- Part 2 verified (P2-G1, P2-G2). This part consumes `createIndexHost`, the complete `main.ts` wiring, the worker compile entrypoint, `mountShell` options and every DI2 feature.

## Execution Flow

```text
P3-G1: Benches, DI1 re-pass, and delivery
```

## Groups

Every delegated agent (implementer, verifier, remediator) reads and follows `.s1mple/S1MPLE.md` and its required references: `docs/communication.md`, `docs/project.md` and `docs/languages/typescript.md`. Delegated agents do not use the native `Explore` subagent.

The user's command to execute the goal includes planned commits, subject to binding project instructions and any limits in the command; do not request separate permission. Commit each task after its checks and self-review pass, and before starting the next task. Commit subjects follow Conventional Commits. Each body carries the task ID and its exact plan title. Record no-change evidence instead of an empty commit.

Never force-push or merge without the user's approval. Parent roadmap files are not edited without the user's explicit authorization; pending parent synchronization is reported separately.

### P3-G1 — Benches, DI1 re-pass, and delivery

#### Goal

- The V13 budgets are gated by `bun run bench`, and Linux CI records the medians.
- Every non-test check (type, build, knip, obsolete references, pins) passes.
- The DI1 suites re-pass.
- The DI2 PR is green on `ubuntu-24.04` and `macos-15`.
- The work folder lives in `work/done/` on a green head.
- G2/G3 evidence is reported.

#### Coverage Summary

- **System Design:** `REQ1, REQ3, REQ4 → DES1, DES10 → S1, S3, S5, S11, S13, S19, S20, S21 → V48–V54`
- **UI Design:** `None`

#### Scope

- Included:
  - `makeNoteWorkspace`;
  - `TARGETS`, `BENCHES` and `runOnce` arguments;
  - `startup.bench.ts` and `indexing-keystroke.bench.ts`;
  - the open-file and source-keystroke benches re-run with analysis;
  - the V54 obsolete-reference case in `test/repo.test.ts`;
  - the final `main.ts` startup-order review;
  - the `project.md` update;
  - full verification, the DI1 re-pass and PR delivery;
  - the work-folder move with `.s1mple` reference updates;
  - the gate evidence report.
- Excluded:
  - new features;
  - parent roadmap edits without authorization;
  - release tagging (only at PH1 exit);
  - merging the PR without the user's approval.
- Main files:
  - `test/fixtures/generate.ts`
  - `scripts/bench-gate.ts`
  - `test/bench/{startup,indexing-keystroke}.bench.ts`
  - `test/repo.test.ts`
  - `src/app/main.ts` (review only unless the order differs)
  - `.s1mple/docs/project.md`
  - the work folder, moved from `.s1mple/work/active/` to `.s1mple/work/done/w261003fx70-navigation-and-links/`

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ1, REQ3, REQ4 → DES10 → S5 → V49, V50, V51` | None | firstFrame < 200 ms, indexReady < 3 s, indexing keystroke p95 ≤ 16 ms, openFile and sourceKeystroke gates hold with analysis; the gate fails above 2× |
| `REQ1, REQ4 → DES1, DES4 → S1, S11 → V52` | None | `tsc` passes with the exhaustive switch; `bun run build` compiles both entrypoints |
| `REQ2 → DES2, DES7 → S19 → V53` | None | knip zero findings |
| `REQ3, REQ7, REQ10 → DES2, DES7, DES11 → S3, S13, S21 → V54` | None | No `Bun.TOML`, no `ft.analyze(`/`analyses` in `src/ui`, no `"buffer.write"`, no `"<leader>": " "`, no `TABSTOP` in `src` or `test` |
| `REQ1 → DES1, DES2, DES3, DES9 → S20 → V48` | None | Parent RM261003ABZP-V1@R1, V17@R1 and V18@R1 DI1 suites pass on both runners |

#### Cross-Work Gates

| Gate source | Affected task or group boundary | Required evidence | Integration owner |
|---|---|---|---|
| G2 — plan context section 2; `rm261003abzp-roadmap-phase-2-obsidian-experience.md:70` (DI2 → DI3: `parseDoc` with block cache and `syntaxExtensions`; `markdownFileType.analyze` and the Markdown key scope; NoteIndex with `resolveLink`; statusline segment framework; `Picker`) | P3-G1-T5, delivery report | Each output's path and symbol on the PR head, plus passing results for V8–V15, V22, V38, V42–V44 and V48. The gate stays `Pending` until the PR is merged with RM261003ABZP-V4@R2, V5@R1, V6@R2 and V18@R1 passing, and the PH1 exit evidence is recorded | RM261003ABZP-DI3@R2 |
| G3 — plan context section 2; `rm261003abzp-roadmap-phase-2-obsidian-experience.md:71` (DI2 → DI4: `Picker` with preview, `Prompt`, NoteIndex paths and frontmatter in summaries, `FileTypeRegistry` and `editorViews`, `search` and `write` effects) | P3-G1-T5, delivery report | Same as G2: output paths and symbols plus V29, V38, V39, V42 and V45 results on the PR head; `Pending` until merge | RM261003ABZP-DI4@R2 |

Neither gate blocks this Work. The report must not claim either gate satisfied before the user merges the PR.

#### Tasks

##### P3-G1-T1 — Startup and indexing benchmarks

- **Outcome:**
  - `makeNoteWorkspace(dir, 10_000)` generates deterministic ~1 KB notes in nested folders with links, tags, headings, frontmatter and block ids.
  - `bench-gate.ts` registers `firstFrame: 200`, `indexReady: 3000` and `indexingKeystrokeP95: 16` with their bench entries, and `runOnce` passes the arguments after the file name.
  - `startup.bench.ts` measures the first statusline row and `◆ index ready` in a PTY.
  - `indexing-keystroke.bench.ts` types 200 keys while the status is indexing.
- **System Design:** `REQ1, REQ3, REQ4 → DES10 → S5 → V49, V50, V51`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `scripts/bench-gate.ts, test/bench/*, test/fixtures/generate.ts`
- **Files:** `test/fixtures/generate.ts:makeNoteWorkspace`, `scripts/bench-gate.ts:TARGETS, BENCHES, runOnce`, `test/bench/startup.bench.ts`, `test/bench/indexing-keystroke.bench.ts`
- **Execution Approach:** `Direct verification — benchmarks are measurements gated by bench-gate, not unit-testable behaviour`

**Steps:**

1. `generate.ts`, `bench-gate.ts` and the two benches

   **Preview:**

   ```ts
   export async function makeNoteWorkspace(dir: string, n = 10_000): Promise<string> { /* deterministic seed; nested folders; ~1 KB notes */ }
   const TARGETS = { sourceKeystrokeP95: 16, openFile: 50, firstFrame: 200, indexReady: 3000, indexingKeystrokeP95: 16 };
   const BENCHES = [/* existing */, "test/bench/startup.bench.ts --metric firstFrame", "test/bench/startup.bench.ts --metric indexReady", "test/bench/indexing-keystroke.bench.ts"];
   async function runOnce(entry: string): Promise<number> { const [file, ...args] = entry.split(" "); /* spawn [execPath, file, ...args] */ }
   ```

   - The gate mechanism stays the same: median of 5, failing above 2× the target.
   - Benches run only through `bun run bench`, never in `check`.

2. **VERIFY — `V49`, `V50`, `V51`:**

   **Preview:**

   ```text
   bun run bench
   └── Expect: every bench passes the 2× gate locally; the medians are printed. Linux CI records the medians in .so-bench/results.json, and for PH1 exit evidence they must be below the targets themselves
   ```

   - Record the local medians in the task evidence. The authoritative numbers come from the Linux CI bench job in T5.

3. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   test(bench): gate startup, index-ready, and indexing keystroke budgets

   Task: P3-G1-T1 — Startup and indexing benchmarks
   ```

**Verification:**

- `V49`–`V51`: `bun run bench` → all gates pass. `bun run check` stays under 30 s.

##### P3-G1-T2 — Obsolete-reference check and startup order

- **Outcome:**
  - A `test/repo.test.ts` case fails if any obsolete reference remains in `src` or `test`. This file is the one the plan context chose for V54.
  - `main.ts` matches the design's construction order: registries → logger → index host → runner → store → `configLoaded` → `stateLoaded` → `shell.attach` → lifecycle → `setImmediate` (watcher and index start).
- **System Design:** `REQ3, REQ7, REQ10 → DES2, DES7, DES11, DES10 → S3, S13, S21, S5 → V54, V52`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 8, V54; section 5, "Construction and Wiring Flow"; section 7, `src/app/main.ts`
- **Files:** `test/repo.test.ts` ("no obsolete references"), `src/app/main.ts:main` (only if the order differs)
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V54`:** write the check, then verify it catches a planted reference (temporarily add `const TABSTOP = 8` to a scratch file under `src`, confirm the failure, then remove it).

   **Preview:**

   ```ts
   test("no obsolete references remain", () => {
     // scan src/** and test/** (excluding this file's patterns and fixtures):
     // forbid "Bun.TOML", "\"buffer.write\"", "\"<leader>\": \" \"", /\bTABSTOP\b/;
     // in src/ui/** also forbid "ft.analyze(" and /\banalyses\b/
   });
   ```

   - Run `bun test test/repo.test.ts`. The planted reference must make it fail.

2. **GREEN:** remove any real leftover the check finds, and confirm the `main.ts` order.

   **Preview:**

   ```ts
   // main.ts order (confirm or reorder only):
   // registries() → createLogger → createIndexHost → createEffectRunner → createStore → dispatch configLoaded → dispatch stateLoaded
   // → shell.attach → installLifecycle({ …, saveSession }) → setImmediate(watchWorkspace + indexHost.start)
   ```

   - No workspace-wide work happens before the first frame.

3. **REFACTOR:** keep the forbidden-pattern list as one table in the test.

   **Preview:**

   ```ts
   // Allowed: { pattern, scope } table. Not allowed: excluding real source directories.
   ```

   - Keep every repo test passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   test(repo): forbid obsolete editor references

   Task: P3-G1-T2 — Obsolete-reference check and startup order
   ```

**Verification:**

- `V54`: `bun test test/repo.test.ts` → passes on the clean tree and fails on the planted reference.
- `V52`: `bun --bun run tsc --noEmit -p .` and `bun run build` → both pass.

##### P3-G1-T3 — Project documentation

- **Outcome:** `.s1mple/docs/project.md` records:
  - the seven new exact pins and their import homes;
  - the worker as a second compile entrypoint (build, release, knip);
  - `SO_LOG=debug` and the `so.log` location;
  - the XDG `config.toml` path and its error format;
  - the state file path and mode, and the bench targets.
- **System Design:** `REQ2, REQ4, REQ7, REQ8 → DES2, DES4, DES7, DES8, DES10 → S11, S13, S14, S16, S19 → None (documentation)`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 4, `.s1mple/docs/project.md`
- **Files:** `.s1mple/docs/project.md`
- **Execution Approach:** `Direct verification — documentation`

**Steps:**

1. `.s1mple/docs/project.md`: update the dependency, boundaries, build, configuration, state and check sections.

   **Preview:**

   ```text
   Dependencies: + mdast-util-from-markdown 2.0.3, micromark-extension-gfm 3.0.0, mdast-util-gfm 3.1.0,
                   micromark-extension-math 3.1.0, mdast-util-math 3.0.0, yaml 2.9.1 (src/core/lang/markdown/),
                   toml-eslint-parser 1.0.3 (src/core/config/)
   Build: bun build --compile src/app/main.ts src/workspace/index-worker.ts --outfile dist/so
   Paths: $XDG_CONFIG_HOME/so/config.toml; $XDG_STATE_HOME/so/<16 hex>/state.json (0600); $XDG_STATE_HOME/so/so.log with SO_LOG=debug
   Bench targets: firstFrame 200, indexReady 3000, indexingKeystrokeP95 16
   ```

   - Follow `docs/communication.md`. Keep the existing structure and do not mention work-process IDs as rules.

2. **VERIFY:**

   **Preview:**

   ```text
   compare project.md against package.json, knip.json, release.yml, config-file.ts, state-file.ts, log.ts, bench-gate.ts
   └── Expect: every stated version, path, and command matches the code
   ```

   - Inspect each fact against its source.

3. **COMMIT:** self-review, then commit.

   **Commit message:**

   ```text
   docs(project): record DI2 pins, worker entrypoint, and paths

   Task: P3-G1-T3 — Project documentation
   ```

**Verification:**

- Manual cross-check → every fact matches its source file.

##### P3-G1-T4 — Full verification and DI1 re-pass

- **Outcome:** every overall check passes locally on the final feature head, and the DI1 suites pass unchanged.
- **System Design:** `REQ1 → DES1–DES11 → S1–S21 → V48, V52, V53 (plus a full re-run of V1–V47, V55–V59)`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 8, Non-test verification and the DI1 suites entry
- **Files:** None (verification only)
- **Execution Approach:** `Direct verification — aggregate checks`

**Steps:**

1. Run the full local suite from a clean install.

   **Preview:**

   ```text
   bun install --frozen-lockfile
   bun run check            (time it: < 30 s)
   bun run test:ci
   bun run build
   bun run bench
   ```

   - Fix nothing silently. A failure goes back to its owning group's remediation, scoped to that group.

2. **VERIFY — `V48`, `V52`, `V53`:**

   **Preview:**

   ```text
   bun test test/integration/{save-safety,open-save,explorer-ops}.test.ts test/e2e/{restore,quit}.test.ts test/ui/file-ops.test.ts
   └── Expect: all pass, with the DI1 test files unchanged in this PR except the planned file-ops additions
   bun --bun run knip       └── Expect: zero findings
   bun --bun run tsc --noEmit -p .   └── Expect: pass
   ```

   - Confirm with `git diff main -- <DI1 suites>` that the DI1 suites changed only as planned: the V45 cases in `file-ops.test.ts` and the `buffer.write` → `file.save` rename where it was referenced.

3. **COMMIT:** no code change is expected. Record the evidence (commands, durations, results) instead of an empty commit.

   **Commit message:**

   ```text
   No commit — verification only; record evidence in the execution report.

   Task: P3-G1-T4 — Full verification and DI1 re-pass
   ```

**Verification:**

- `V48`, `V52`, `V53`: as above → all pass; `check` < 30 s.

##### P3-G1-T5 — Delivery

- **Outcome:**
  - The DI2 PR from `feat/rm261003abzp-di2-navigation-and-links` to `main` is open, with conflicts resolved and CI green: `check`, the `test:ci` matrix on `ubuntu-24.04` and `macos-15`, and the Linux `bench`.
  - The work folder has moved to `.s1mple/work/done/`, with `.s1mple` references updated, and CI is green again on the new head.
  - G2/G3 evidence and the pending parent-sync rows are reported.
- **System Design:** `REQ1 → DES10 → S5, S20 → V48, V49–V51 (CI evidence)`
- **UI Design:** `None`
- **Canonical Shapes:** `.s1mple/S1MPLE.md` Delivery; system design section 7, "Migration and Delivery"; plan index Roadmap Contract
- **Files:** the work folder, moved from `.s1mple/work/active/` to `.s1mple/work/done/w261003fx70-navigation-and-links/`; any `.s1mple` file that references the active path
- **Execution Approach:** `Direct verification — delivery steps`

**Steps:**

1. Push the branch and open the PR.

   **Preview:**

   ```text
   git push -u origin feat/rm261003abzp-di2-navigation-and-links
   gh pr create --base main --title "feat: DI2 navigation and links (W261003FX70)" --body "<summary; verification evidence; G2/G3 outputs; pending parent sync rows 1–9>"
   gh pr checks --watch
   ```

   - If `main` has moved, merge or rebase `main` locally and resolve the conflicts without force-pushing.
   - If CI fails, fix it within the owning group's scope and push again.

2. Move the work folder and update the references.

   **Preview:**

   ```text
   git mv .s1mple/work/{active,done}/w261003fx70-navigation-and-links
   rg -l "work/active/w261003fx70" .s1mple   → update each to work/done/…
   ```

   - Do not edit the parent roadmap files under `rm261003abzp-so-v1/` unless the user explicitly authorizes the parent sync.

3. **VERIFY — CI on the new head:**

   **Preview:**

   ```text
   git push ; gh pr checks --watch
   └── Expect: check, test:ci (ubuntu-24.04, macos-15), and bench all green on the new head; bench medians recorded
   ```

   - Capture the run URLs and the bench medians for the report.

4. **COMMIT:** commit the folder move and the reference updates.

   **Commit message:**

   ```text
   chore(s1mple): move W261003FX70 work folder to done

   Task: P3-G1-T5 — Delivery
   ```

   - Never force-push, and never merge without the user's approval.

**Verification:**

- PR URL; green CI on the final head (`check`, `test:ci` on both runners, `bench`).
- G2/G3: output paths and symbols plus the V results on the PR head. The status stays `Pending` until the user merges.
- Parent sync: rows 1–9 from design section 1 are reported as pending unless the user authorizes them.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Passes in < 30 s, including V54 |
| Full suites | `bun run test:ci` | All component, integration and e2e suites pass, including V48 |
| Build | `bun run build` | Main and worker compile |
| Benchmarks | `bun run bench` (local and Linux CI) | Gates pass; CI medians recorded |
| Lockfile | `bun install --frozen-lockfile` | Passes |
| PR CI | `gh pr checks` on the final head | All green on `ubuntu-24.04` and `macos-15` |

#### Review and Verification Focus

- **Specification:**
  - S5 and S20 hold.
  - The non-test checks V52–V54 pass.
  - The delivery follows `.s1mple/S1MPLE.md` exactly.
  - G2/G3 are reported as produced but `Pending` until merge.
  - Parent sync stays pending without authorization.
- **Technical:**
  - Benches stay out of `check`.
  - The obsolete-reference check scans real sources and cannot be bypassed.
  - The DI1 suites are unchanged except for the planned additions.
  - There is no force-push and no merge.
  - The work-folder references are all updated.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ1, REQ3, REQ4 → DES10 → S5 → V49, V50, V51` | None | `P3-G1` | `P3-G1-T1`, `P3-G1-T5` |
| `REQ3, REQ7, REQ10 → DES2, DES7, DES11 → S3, S13, S21 → V54` | None | `P3-G1` | `P3-G1-T2` |
| `REQ1, REQ4 → DES1, DES4 → S1, S11 → V52` | None | `P3-G1` | `P3-G1-T2`, `P3-G1-T4` |
| `REQ2 → DES2, DES7 → S19 → V53` | None | `P3-G1` | `P3-G1-T4` |
| `REQ1 → DES1, DES2, DES3, DES9 → S20 → V48` | None | `P3-G1` | `P3-G1-T4`, `P3-G1-T5` |
| Docs: `DES2, DES4, DES7, DES8, DES10` project facts | None | `P3-G1` | `P3-G1-T3` |
| Gates G2, G3 (evidence) | None | `P3-G1` | `P3-G1-T5` |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- G2 and G3 outputs exist on the PR head and their evidence is reported. Both stay `Pending` for DI3/DI4 until the user merges the PR; this part does not infer roadmap delivery.
- Every source obligation is covered, and the delivery steps from `.s1mple/S1MPLE.md` are complete.

## Planning Gaps

None
