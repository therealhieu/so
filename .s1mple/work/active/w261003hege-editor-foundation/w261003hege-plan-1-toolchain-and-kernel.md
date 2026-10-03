# W261003HEGE Plan Part 1 — Toolchain and Kernel

## Status

`Ready`

## Objective

Turn the empty repository into a pinned Bun/TypeScript 7 project whose repository policies (exact pins, SHA-pinned actions, PR-only CI, layer boundaries) are locked by tests, and land the pure kernel — text buffer, undo, registers, windows, Neovim-equal vim engine, command registry and keymap, kernel text view — plus the file-type registry, the 34-language table, and the windowed lowlight highlighter. At the end of this part every later group can build on verified kernel contracts and run `bun run check`.

## Coverage Summary

- **System Design:** `W261003HEGE-REQ1@R3, REQ2@R2, REQ3@R1, REQ4@R3, REQ10@R2, REQ11@R2, REQ12@R1 → DES1, DES3, DES6, DES7, DES13 (explorer default bindings; V7.5 proved in P2-G1-T5), DES14 (ci.yml, boundary and repo tests), DES15 (workflows, release config) → S1, S2, S6, S7, S15, S16, S17 → V1.1, V1.2, V1.4, V2.1 (non-ex cases; ex cases close in P2-G1-T5), V2.2, V2.3, V2.4, V6.1, V6.2, V6.3, V7.1, V7.2, V7.4, V15.1, V16.2`
- **UI Design:** `None — Part 1 has no UI surface; parent UI obligations are verified in Part 3 (S14 → V14.1–V14.4)`

## Sources

- Plan index: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-plan-index.md`
- Plan context: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-plan-context.md`
- System design: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-system-design.md`
- UI design: `Not applicable — no work-level UI design; parent rm261003abzp-ui-design.md is consumed in Part 3`
- System requirements: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-requirements.md`
- UI requirements: `Not applicable — parent UREQs bound through W261003HEGE-REQ1@R3 and verified in Part 3`
- Research: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-research.md`
- Roadmap binding: `w261003hege-discuss-context.md`, Roadmap Binding (RM261003ABZP-PH1@R2, RM261003ABZP-DI1@R2)

## Dependencies

- None — first part.
- Execution prerequisites (plan context section 7): Bun 1.4.2 installed before `bun.lock` is generated (local Bun is 1.3.10); Neovim v0.11.7 downloaded to a temporary location before recording (local Neovim is 0.12.4).

## Execution Rules for Every Group

- Every delegated agent reads and follows `.s1mple/S1MPLE.md` and its required references (`.s1mple/docs/communication.md`, `.s1mple/docs/project.md`, `.s1mple/docs/languages/typescript.md`) before acting.
- Subagents do not spawn subagents. Do not use the native `Explore` subagent; inspect directly or use `s1mple-explore`.
- Implementation is lean and simple (S1MPLE Implementation, 2026-10-03): no abstractions, files, symbols, or AppState fields beyond the system design; no later-DI files (`src/preview`, `src/ui/widgets`, `core/lang/markdown/{doc,blocks,syntax}.ts`, `core/features/**`, `workspace/{index-worker,config-file,state-file}.ts`).
- The system design is the authority; previews below show only task-owned deltas. Where a preview and the design differ, the design wins and the difference is reported.
- Do not edit parent roadmap files (`.s1mple/work/active/rm261003abzp-so-v1/**`); parent synchronization is pending and owned by the main orchestrator.
- **Interim `knip` rule:** until P3-G1 wires `src/app/main.ts`, `knip` may report unused files or exports only for G1 symbols whose consumer is a later group per the plan index Cross-Part Coordination table. Record every such finding in the group report; any other finding fails the check. P3-G1 requires zero findings.

## Execution Flow

```text
P1-G1: Toolchain, repository policy, CI and release definitions → P1-G2: Kernel, file types, and recorded vim table
```

## Groups

The user's command to execute the goal includes planned commits, subject to binding project instructions and any limits in the command; do not request separate permission. Commit each task after its checks and self-review pass and before starting the next task. Follow the repository's Conventional Commits convention (`docs: …` in history; release-please parses it) with task IDs and exact plan titles in the body. Task commits are checkpoints, not group acceptance. Record no-change evidence instead of an empty commit.

### P1-G1 — Toolchain, Repository Policy, CI and Release Definitions

#### Goal

`bun install --frozen-lockfile` succeeds with Bun 1.4.2; `test/repo.test.ts` proves exact npm pins, SHA-pinned actions, and the `pull_request`-only CI trigger; `test/boundaries.test.ts` proves the layer rules and fails on both violation fixtures; the release workflows build, smoke, and publish in the designed order; and the project docs record the toolchain.

#### Coverage Summary

- **System Design:** `REQ2@R2, REQ4@R3, REQ12@R1, REQ1@R3 → DES1, DES14, DES15 → S1, S7, S15, S16 → V1.1, V1.2, V1.4, V7.1, V7.2, V15.1, V16.2`
- **UI Design:** `None — toolchain and repository policy`

#### Scope

- Included: toolchain files, `bin/so`, `bun.lock`, `.gitignore` update, `test/repo.test.ts`, `.github/workflows/ci.yml`, release workflows and release-please config, `test/boundaries.test.ts` with violation fixtures, project and TypeScript docs.
- Excluded: any `src/**` code (boundary scan runs on an empty or kernel-only tree), `test/e2e`, `test/bench`, `scripts/bench-gate.ts`, `src/app/main.ts` `VERSION` (Part 3), pushing anything to GitHub (Part 3, user-authorized).
- Main files: `package.json`, `bun.lock`, `bunfig.toml`, `tsconfig.json`, `biome.json`, `knip.json`, `bin/so`, `.gitignore`, `test/repo.test.ts`, `.github/workflows/{ci,release-please,release}.yml`, `release-please-config.json`, `.release-please-manifest.json`, `test/boundaries.test.ts`, `test/fixtures/boundary-violation/{core-imports-fs.ts,kernel-imports-markdown.ts}`, `.s1mple/docs/project.md`, `.s1mple/docs/languages/typescript.md`

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ2@R2 → DES1 → S1 → V1.1, V1.2, V1.4` | None | Exact pins, frozen lockfile, SHA-pinned actions, docs equal to `package.json` |
| `REQ4@R3 → DES14 → S15 → V15.1` | None | `ci.yml` triggers on `pull_request` only, PR-number concurrency, cancel-in-progress |
| `REQ1@R3 → DES14 → S7 → V7.1, V7.2` | None | Layer rules enforced; violation fixtures detected |
| `REQ12@R1 → DES15 → S16 → V16.2` | None | `publish` needs `smoke`; four native smoke labels; tag and `workflow_call` triggers |

#### Cross-Work Gates

| Gate source | Affected task or group boundary | Required evidence | Integration owner |
|---|---|---|---|
| G1 — `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:73` (plan context section 2); producer DI1 (this work), consumer RM261003ABZP-DI2@R2 | P1-G1 produces the G1 outputs `bun run check` and CI definition; due before DI2 execution, not before any task here | `check` script and `ci.yml` exist and pass V1.1, V1.2, V15.1 locally; CI green on the merged DI1 PR is collected in P3-G1 | RM261003ABZP-DI2@R2 |

#### Tasks

##### P1-G1-T1 — Install Bun 1.4.2 and add toolchain files

- **Outcome:** Bun 1.4.2 is the active runtime; toolchain files exist with exact pins; `bun install` writes a `bun.lock` that installs with `--frozen-lockfile`; `bun --bun run tsc --noEmit -p .` and `biome check .` pass on the empty tree.
- **System Design:** `W261003HEGE-REQ2@R2` → `W261003HEGE-DES1` → `S1` → `V1.1` (proved in T2)
- **UI Design:** `None — toolchain`
- **Canonical Shapes:** System design §7 — `package.json`, `bunfig.toml`, `tsconfig.json`, `biome.json`, `knip.json`, `bin/so` (lines 1256–1323); §4 Project Structure entries for `biome.json`, `knip.json`, `bin/so`, `.gitignore` (lines 247–286)
- **Files:** `package.json`, `bunfig.toml`, `tsconfig.json`, `biome.json`, `knip.json`, `bin/so`, `bun.lock`, `.gitignore`
- **Execution Approach:** `Direct verification — configuration files have no behavior to drive with a failing test; V1.1 locks them in T2`

**Steps:**

1. Runtime prerequisite — Bun 1.4.2

   **Preview:**

   ```text
   curl -fsSL https://bun.sh/install | bash -s "bun-v1.4.2"   # official installer, pinned version
   bun --version                                               # must print 1.4.2 before any `bun install`
   ```

   - Do not generate `bun.lock` with any other Bun version.

2. `package.json`, `bunfig.toml`, `tsconfig.json`, `biome.json`, `knip.json`, `bin/so`, `.gitignore` — toolchain files

   **Preview:**

   ```jsonc
   // package.json — copy the scripts and exact versions from system design §7 lines 1290–1300 verbatim
   // (packageManager "bun@1.4.2"; deps @opentui/core 0.5.14, lowlight 3.3.0, zod 4.6.5, ignore 7.0.12;
   //  dev typescript 7.0.2, @types/bun 1.4.2, @biomejs/biome 2.5.15, knip 6.39.0, @xterm/headless 6.0.0)
   // knip.json — { "entry": ["src/app/main.ts", "scripts/*.ts", "test/**/*.ts"], "project": ["src/**/*.ts"] }
   // biome.json — formatter + linter; ignore "test/vim/expected.json", "dist", "test/fixtures/boundary-violation"
   ```

   ```sh
   #!/usr/bin/env bun
   # bin/so (executable): import "../src/app/main.ts" — target file arrives in P3-G1
   ```

   - `bunfig.toml` holds only `[install] exact = true`; `tsconfig.json` equals §7 lines 1309–1314.
   - `.gitignore` adds `.so-bench/`; keep existing entries.
   - Install with `bun install` (exact via bunfig), then confirm `bun install --frozen-lockfile` is a no-op.

3. **VERIFY — `V1.1` (preview), `S1`:**

   **Preview:**

   ```text
   bun --version                         └── Expect: 1.4.2
   bun install --frozen-lockfile         └── Expect: exit 0, lockfile unchanged
   grep -E '"[\^~]' package.json         └── Expect: no output
   bunx biome check . && bun --bun run tsc --noEmit -p .   └── Expect: exit 0
   ```

   - Run each command and record outputs in the task report.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   build: add pinned Bun and TypeScript toolchain

   Task: P1-G1-T1 — Install Bun 1.4.2 and add toolchain files
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V1.1` (preliminary) — `grep -E '"[\^~]' package.json` → no output; full assertion in T2.
- `S1` — `bun install --frozen-lockfile` → exit 0 with Bun 1.4.2.

##### P1-G1-T2 — Lock repository policy and PR-only CI

- **Outcome:** `test/repo.test.ts` asserts exact npm pins and `packageManager`, 40-hex SHA action refs with version comments, and the `pull_request`-only trigger with PR-number concurrency; `.github/workflows/ci.yml` satisfies it.
- **System Design:** `W261003HEGE-REQ2@R2, REQ4@R3` → `W261003HEGE-DES1, DES14` → `S1, S15` → `V1.1, V1.2, V15.1`
- **UI Design:** `None — repository policy`
- **Canonical Shapes:** System design §7 — `.github/workflows/ci.yml` … (lines 2387–2466, YAML at 2417–2440); §8 `test/repo.test.ts` cases (V1.1, V1.2, V15.1)
- **Files:** `test/repo.test.ts`, `.github/workflows/ci.yml`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V1.1`, `V1.2`, `V15.1`:** `test/repo.test.ts` — parse `package.json` and every `.github/workflows/*.yml`

   **Preview:**

   ```ts
   // Bun.YAML.parse (or Bun's built-in YAML import) for workflows; no new dependency.
   test("V1.1 exact npm pins", () => {
     for (const v of Object.values({ ...pkg.dependencies, ...pkg.devDependencies }))
       expect(v).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/);
     expect(pkg.packageManager).toBe("bun@1.4.2");
   });
   test("V1.2 SHA-pinned actions", () => {
     // read raw workflow text; for every `uses:` line (skip local "./" refs):
     // expect(line).toMatch(/uses:\s+[\w.-]+\/[\w.-]+(\/[\w.-]+)*@[0-9a-f]{40}\s+#\s*v\S+/)
   });
   test("V15.1 CI runs on pull_request only", () => {
     expect(Object.keys(ci.on)).toEqual(["pull_request"]);
     expect(ci.concurrency.group).toContain("github.event.pull_request.number");
     expect(ci.concurrency["cancel-in-progress"]).toBe(true);
   });
   ```

   - Run `bun test test/repo.test.ts` and confirm V1.2/V15.1 fail because `ci.yml` is missing (V1.1 passes after T1; confirm it would fail on a `^` version by a quick local edit, then revert).

2. **GREEN:** `.github/workflows/ci.yml`

   **Preview:**

   ```yaml
   # Copy system design §7 lines 2417–2440. Resolve every <sha> at execution time:
   #   gh api repos/actions/checkout/commits/v5 --jq .sha
   #   gh api repos/oven-sh/setup-bun/commits/v2.2.0 --jq .sha
   # and write `uses: owner/repo@<40-hex> # <tag>`.
   on: { pull_request: { branches: [main] } }        # no push trigger (REQ4@R3, user memory ci-pull-request-only)
   ```

   - Keep jobs `check` (ubuntu-24.04) and `test` (matrix ubuntu-24.04, macos-15; `bun run bench` only on Linux).

3. **REFACTOR:** Extract a small workflow-loading helper inside `test/repo.test.ts` if repeated.

   **Preview:**

   ```ts
   // allowed: const workflows = loadWorkflows(".github/workflows") inside the test file
   // prohibited: new shared test utilities or dependencies
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   ci: add pull-request-only CI and repository policy tests

   Task: P1-G1-T2 — Lock repository policy and PR-only CI
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V1.1` — `bun test test/repo.test.ts -t V1.1` → pass.
- `V1.2` — `bun test test/repo.test.ts -t V1.2` → pass for `ci.yml`.
- `V15.1` — `bun test test/repo.test.ts -t V15.1` → pass.

##### P1-G1-T3 — Add release workflows and release-please config

- **Outcome:** `release.yml` builds four targets on one runner, smokes each on its native runner, and publishes only after all smoke jobs; `release-please.yml` calls it via `workflow_call`; every action is SHA-pinned.
- **System Design:** `W261003HEGE-REQ12@R1, REQ2@R2` → `W261003HEGE-DES15` → `S16, S1` → `V16.2, V1.2`
- **UI Design:** `None — release automation`
- **Canonical Shapes:** System design §7 — `.github/workflows/release-please.yml`, `release.yml`, `release-please-config.json` (lines 2468–2551); §5 Release (lines 869–884); §4 entries for `.release-please-manifest.json`
- **Files:** `.github/workflows/release.yml`, `.github/workflows/release-please.yml`, `release-please-config.json`, `.release-please-manifest.json`
- **Execution Approach:** `Direct verification — workflow behavior runs only on GitHub; V1.2 (already written in T2) re-proves pins and V16.2 is a definition review; V16.1 runs in P3-G1`

**Steps:**

1. `.github/workflows/release.yml`, `.github/workflows/release-please.yml`, `release-please-config.json`, `.release-please-manifest.json`

   **Preview:**

   ```yaml
   # release.yml — copy system design §7 lines 2496–2535; resolve <sha> for actions/checkout v5,
   # oven-sh/setup-bun v2.2.0, actions/upload-artifact v4, actions/download-artifact v4 via `gh api …/commits/<tag> --jq .sha`.
   # release-please.yml — on: push: branches [main]; job rp: googleapis/release-please-action@<sha> # v5
   #   then job release: needs rp, if: needs.rp.outputs.release_created, uses: ./.github/workflows/release.yml,
   #   with: { tag: ${{ needs.rp.outputs.tag_name }} }, secrets: inherit
   ```

   ```jsonc
   // release-please-config.json = §7 lines 2538–2540; .release-please-manifest.json = { ".": "0.0.0" }
   ```

   - `publish` must `needs: smoke`; smoke matrix has `macos-15`, `macos-15-intel`, `ubuntu-24.04`, `ubuntu-24.04-arm`.

2. **VERIFY — `V1.2`, `V16.2`:**

   **Preview:**

   ```text
   bun test test/repo.test.ts                      └── Expect: V1.1, V1.2, V15.1 pass across all three workflows
   review release.yml                              └── Expect: publish.needs == smoke; 4 native labels; triggers push tags v* + workflow_call(tag)
   bunx biome check .                              └── Expect: exit 0
   ```

   - Record the V16.2 review result for the PR description (P3-G1-T7).

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   ci: add release workflows with native smoke

   Task: P1-G1-T3 — Add release workflows and release-please config
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V1.2` — `bun test test/repo.test.ts -t V1.2` → every `uses:` in three workflows is a 40-hex SHA with a version comment.
- `V16.2` — workflow review → `publish` needs `smoke`; four native smoke labels present.

##### P1-G1-T4 — Enforce layer boundaries

- **Outcome:** `test/boundaries.test.ts` scans `src/**/*.ts` with `Bun.Transpiler.scanImports` against `LAYER_RULES` and reports both violation fixtures.
- **System Design:** `W261003HEGE-REQ1@R3` → `W261003HEGE-DES14` → `S7` → `V7.1, V7.2`
- **UI Design:** `None — architecture rule`
- **Canonical Shapes:** System design §7 Boundaries bullet (line 2463); Binding Constraints (`rm261003abzp-design.md:50-57`); §8 `test/boundaries.test.ts`
- **Files:** `test/boundaries.test.ts` — `LAYER_RULES`, `checkImports`; `test/fixtures/boundary-violation/core-imports-fs.ts`, `kernel-imports-markdown.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V7.2`:** `test/boundaries.test.ts` — fixtures must be reported

   **Preview:**

   ```ts
   test("V7.2 violation fixtures are reported", () => {
     // core-imports-fs.ts is checked as if at src/core/state/x.ts and imports "node:fs"
     // kernel-imports-markdown.ts is checked as if at src/core/kernel/x.ts and imports "../lang/markdown/file-type"
     expect(checkImports(fixture("core-imports-fs.ts"), "src/core/state/x.ts")).toHaveLength(1);
     expect(checkImports(fixture("kernel-imports-markdown.ts"), "src/core/kernel/x.ts")).toHaveLength(1);
   });
   test("V7.1 src respects LAYER_RULES", () => {
     // for each file in new Bun.Glob("src/**/*.ts").scan(): expect(checkImports(read(f), f)).toEqual([])
   });
   ```

   - Run `bun test test/boundaries.test.ts` and confirm failure because `checkImports` does not exist.

2. **GREEN:** `test/boundaries.test.ts` — `LAYER_RULES`, `checkImports`

   **Preview:**

   ```ts
   // LAYER_RULES encodes rm261003abzp-design.md:50-57:
   //   src/core/**      → no node:*, bun, @opentui/*, ../workspace, ../ui, ../app
   //   src/core/kernel/** → only src/core/kernel/** (plus no external packages)
   //   src/core/filetypes → kernel; src/core/lang → kernel, filetypes (lowlight allowed in lang/code)
   //   only src/ui/** may import @opentui/*
   export function checkImports(source: string, path: string): string[] {
     // new Bun.Transpiler({ loader: "ts" }).scanImports(source) → resolve relative specifiers against path → match rules
   }
   ```

   - Keep the rule table data-only; no runtime import of `src`.

3. **REFACTOR:** Tighten messages to `<file>: <specifier> violates <rule>`.

   **Preview:**

   ```ts
   // allowed: message formatting; prohibited: loosening any rule or adding allow-lists
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   test: enforce layer and kernel import boundaries

   Task: P1-G1-T4 — Enforce layer boundaries
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V7.1` — `bun test test/boundaries.test.ts -t V7.1` → pass (re-run in every later group).
- `V7.2` — `bun test test/boundaries.test.ts -t V7.2` → both fixtures reported.

##### P1-G1-T5 — Record the toolchain in project docs

- **Outcome:** `.s1mple/docs/project.md` and `.s1mple/docs/languages/typescript.md` replace "Not established" with the stack, exact pins, scripts, test layers, PR-only CI trigger, branch `main`, and TS/Biome/knip/`bun test` conventions.
- **System Design:** `W261003HEGE-REQ2@R2` → `W261003HEGE-DES1` → `S1` → `V1.4`
- **UI Design:** `None — documentation`
- **Canonical Shapes:** System design §4 entries for `.s1mple/docs/project.md` and `typescript.md` (lines 425–430); DES1 (lines 2961–2989)
- **Files:** `.s1mple/docs/project.md`, `.s1mple/docs/languages/typescript.md`
- **Execution Approach:** `Direct verification — documentation; V1.4 is a review`

**Steps:**

1. `.s1mple/docs/project.md`, `.s1mple/docs/languages/typescript.md`

   **Preview:**

   ```text
   project.md: stack (Bun 1.4.2, TS 7.0.2, @opentui/core 0.5.14, lowlight 3.3.0, zod 4.6.5, ignore 7.0.12);
     scripts (dev, check < 30 s unit-only, test:ci, bench, build, record:vim); test layers (unit, integration,
     component, e2e PTY, bench); CI on pull_request only; four-layer structure; default branch main.
   typescript.md: tsconfig rules (strict, Preserve/bundler, verbatimModuleSyntax, noUncheckedIndexedAccess,
     exactOptionalPropertyTypes, skipLibCheck — reason RF1); run tsc via `bun --bun run tsc`; Biome; knip;
     colocated `*.test.ts` with `bun test`.
   ```

   - Follow `.s1mple/docs/communication.md`; keep the existing heading structure.

2. **VERIFY — `V1.4`:**

   **Preview:**

   ```text
   compare every version in both docs with package.json and packageManager
   └── Expect: exact equality; no "Not established" left for stack, checks, or TypeScript rules
   ```

   - Record the comparison in the task report.

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   docs: record toolchain, checks, and TypeScript rules

   Task: P1-G1-T5 — Record the toolchain in project docs
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V1.4` — doc review → recorded versions equal `package.json` exactly.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Frozen install | `bun install --frozen-lockfile` | Exit 0 with Bun 1.4.2 |
| Repository policy | `bun test test/repo.test.ts` | V1.1, V1.2, V15.1 pass |
| Boundaries | `bun test test/boundaries.test.ts` | V7.1, V7.2 pass |
| Format and types | `bunx biome check . && bun --bun run tsc --noEmit -p .` | Exit 0 |
| Release definition | Review of `release.yml` | V16.2 holds |
| Docs | Review | V1.4 holds |

#### Review and Verification Focus

- **Specification:** exact pins from §7 only; `packageManager` is the single Bun source; CI has no `push` trigger; release publish waits on four native smoke jobs; no `src/**` code added.
- **Technical:** SHA refs resolve to the tagged commits; repo test actually fails on `^`/mutable refs; boundary rules match `rm261003abzp-design.md:50-57` exactly, including `@opentui/*` only in `src/ui`.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

### P1-G2 — Kernel, File Types, and Recorded Vim Table

#### Goal

The kernel (`src/core/kernel/**`) implements the parent DES3/DES4/DES5@R2/DES9@R3 contracts at the system design's file split; every recorded Neovim 0.11.7 case that does not need ex execution replays equal through `handleKey`; `layoutText` handles all four decoration kinds within the viewport; and the file-type registry, language table, and windowed highlighter resolve and colour files correctly.

#### Coverage Summary

- **System Design:** `REQ1@R3, REQ3@R1, REQ10@R2, REQ11@R2 → DES3, DES6, DES7, DES13 (explorer default bindings) → S2, S6, S7, S17 → V2.1 (non-ex cases), V2.2, V2.3, V2.4, V6.1, V6.2, V6.3, V7.1, V7.4`
- **UI Design:** `None — pure kernel and file types`

#### Scope

- Included: `src/core/kernel/{text,editor,vim,commands,view}/**`, `src/core/filetypes/registry.ts`, `src/core/lang/code/{file-types,highlight}.ts`, `src/core/lang/markdown/file-type.ts`, `scripts/record-vim.ts`, `scripts/record-vim.test.ts`, `test/vim/{cases.ts,expected.json,vim.test.ts}`, colocated unit tests.
- Excluded: `core/state` routing (P2-G1; ex cases such as `:s`/`:%s` and `"+` paste finish there), UI painting (P3-G1), Markdown `analyze` and `live`/`reading` views (DI2/DI3).
- Main files: as listed in system design §4 lines 340–363 and 414–415.

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ1@R3 → DES3 → S2 → V2.4` | None | Buffer edits and inverses round-trip, including surrogates |
| `REQ3@R1 → DES3 → S2 → V2.2, V2.3` | None | Recorder refuses non-0.11 Neovim; fixture metadata valid |
| `REQ1@R3, REQ3@R1 → DES3 → S2 → V2.1` | None | Non-ex recorded cases equal through `handleKey` (ex cases close in P2-G1-T5) |
| `REQ1@R3 → DES7 → S7, S17 → V7.4` | None | All decoration kinds, viewport rows only |
| `REQ11@R2 → DES6 → S6, S17 → V6.1, V6.2, V6.3` | None | Path → file type; table integrity; windowed, cached, failure-safe highlighting |
| `REQ1@R3 → DES3, DES7, DES6 → S7 → V7.1` | None | Kernel imports only kernel; no language code in kernel |

#### Cross-Work Gates

| Gate source | Affected task or group boundary | Required evidence | Integration owner |
|---|---|---|---|
| G1 — `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:73`; producer DI1, consumer RM261003ABZP-DI2@R2 | P1-G2 produces G1 outputs `CommandRegistry`, `Keymap` with `KeyScope`, `layoutText`, `Decoration`, `FileTypeRegistry` (`text`, code, `markdown` source), `lowlightHighlighter`; due before DI2 execution | Shapes equal parent `rm261003abzp-design.md:493-510, 607-620, 654-681`; V7.4, V6.1–V6.3 pass; parent V2@R1 maps to V2.1 (complete after P2-G1); final evidence collected in P3-G1-T6 | RM261003ABZP-DI2@R2 |

#### Tasks

##### P1-G2-T1 — Add text buffer and editor primitives

- **Outcome:** `TextBuffer`/`createTextBuffer`, `Pos`/`Range`/`Edit`, `UndoHistory` (blocks with cursor), `Registers` (`"`, `0-9`, `a-z`, `+`, `-`), and `WindowTree` (`splitWindow`, `closeWindow`, `focusDirection`) exist at parent shapes; edit/inverse round-trips.
- **System Design:** `W261003HEGE-REQ1@R3` → `W261003HEGE-DES3` → `S2` → `V2.4`
- **UI Design:** `None — kernel`
- **Canonical Shapes:** System design §7 `src/core/kernel/**` symbol table (lines 1735–1745); parent `rm261003abzp-design.md:537-542` (TextBuffer), `:367` (UTF-16, `\n` in memory)
- **Files:** `src/core/kernel/text/{pos,text-buffer}.ts`, `src/core/kernel/editor/{undo,registers,windows}.ts`, `src/core/kernel/text/text-buffer.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V2.4`:** `src/core/kernel/text/text-buffer.test.ts`

   **Preview:**

   ```ts
   test.each([["multi-line", "a\nbc\nd"], ["empty", ""], ["surrogate", "x😀y\nz"]])("V2.4 %s round-trip", (_, text) => {
     const b0 = createTextBuffer(text);
     const { buffer: b1, inverse } = b0.apply(edit);       // edit spans a line join / surrogate pair
     const { buffer: b2 } = b1.apply(inverse);
     expect(b2.text()).toBe(text); expect(b2.version).toBe(b0.version + 2); expect(b2.lineCount).toBeGreaterThanOrEqual(1);
   });
   ```

   - Run `bun test src/core/kernel/text` and confirm failure (module missing).

2. **GREEN:** `text/{pos,text-buffer}.ts`, `editor/{undo,registers,windows}.ts`

   **Preview:**

   ```ts
   // createTextBuffer(text): split on "\n"; immutable per version; apply(edit) → { buffer, inverse }
   // UndoHistory: push(block{edits, cursorBefore, cursorAfter}); undo/redo return inverse edit lists
   // Registers: get/set by RegisterName; yank shifts "0; delete shifts "1–"9; "- small delete
   // WindowTree: splitWindow(dir), closeWindow(id), focusDirection(h|j|k|l)
   ```

   - Keep parent interface exactly; `finalNewline`, BOM, EOL stay outside `TextBuffer` (BufferState, P2-G1).

3. **REFACTOR:** Remove duplication between apply and inverse construction.

   **Preview:**

   ```ts
   // allowed: private helpers in text-buffer.ts; prohibited: new exports beyond §7 symbols
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(kernel): add text buffer, undo, registers, and window tree

   Task: P1-G2-T1 — Add text buffer and editor primitives
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V2.4` — `bun test src/core/kernel/text` → round-trip text, `version + 2`, `lineCount ≥ 1`.
- `V7.1` — `bun test test/boundaries.test.ts` → pass.

##### P1-G2-T2 — Add command registry, keymap, and default bindings

- **Outcome:** `CommandRegistry`, `Command`, `Mode`, `KeyScope`, `Keymap` (lookup returns `command` | `prefix` | `none`, `{mode, filetype}` scope beats `{mode}`), `WhichKeyItem`, and `defaultBindings` (global vim/ex/window/explorer bindings, `<leader>e`, `Ctrl-w h/j/k/l`, explorer `a r m d Enter l h` → `explorer.*` ids) exist at parent shapes.
- **System Design:** `W261003HEGE-REQ1@R3, REQ10@R2` → `W261003HEGE-DES3, DES13` → `S7` → `V7.5` (proved through routing in P2-G1-T5)
- **UI Design:** `None — kernel`
- **Canonical Shapes:** Parent `rm261003abzp-design.md:493-510`; system design §7 `defaultBindings` row (line 1745); §7 explorer wiring (line 1611)
- **Files:** `src/core/kernel/commands/{registry,keymap,defaults}.ts`
- **Execution Approach:** `Direct verification — the parent contract is behavior-free registration; its precedence is proven by V7.5 in P2-G1-T5, which consumes it`

**Steps:**

1. `src/core/kernel/commands/{registry,keymap,defaults}.ts`

   **Preview:**

   ```ts
   // registry.ts / keymap.ts: exact parent shapes (rm261003abzp-design.md:493-510); register throws on duplicate id
   export const defaultBindings: readonly { scope: KeyScope; seq: Key[]; id: string }[] = [
     // { scope: { mode: "explorer" }, seq: ["a"], id: "explorer.create" }, … r/m/d/Enter/l/h
     // { scope: { mode: "normal" }, seq: ["<leader>", "e"], id: "explorer.toggle" }, Ctrl-w h/j/k/l → window.focus{h,j,k,l}
   ];
   ```

   - Command ids must match those `registerBuiltins` registers in P2-G1 (§7 line 1679).

2. **VERIFY — `V7.1`:**

   **Preview:**

   ```text
   bun --bun run tsc --noEmit -p . && bun test test/boundaries.test.ts
   └── Expect: exit 0; kernel files import only kernel
   ```

   - Run and record.

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(kernel): add command registry, keymap, and default bindings

   Task: P1-G2-T2 — Add command registry, keymap, and default bindings
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V7.1` — `bun test test/boundaries.test.ts` → pass.
- Typecheck — `bun --bun run tsc --noEmit -p .` → exit 0.

##### P1-G2-T3 — Record Neovim 0.11 expectations

- **Outcome:** `scripts/record-vim.ts` refuses non-0.11 Neovim and records every case in `test/vim/cases.ts` over RPC into `test/vim/expected.json` with `nvim: "0.11.7"`; `cases.ts` covers REQ2's command list.
- **System Design:** `W261003HEGE-REQ3@R1` → `W261003HEGE-DES3` → `S2` → `V2.2, V2.3`
- **UI Design:** `None — tooling`
- **Canonical Shapes:** System design §7 `scripts/record-vim.ts`, `test/vim/*` (lines 1778–1824); §5 Vim expectation recording (lines 835–850); §6 `test/vim/expected.json` schema (line 1230)
- **Files:** `scripts/record-vim.ts` — `main`, `assertNvim011`, `recordCase`; `scripts/record-vim.test.ts`; `test/vim/cases.ts` — `cases`; `test/vim/expected.json`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V2.3`:** `scripts/record-vim.test.ts`

   **Preview:**

   ```ts
   test("V2.3 refuses Neovim 0.12", async () => {
     // write a tmp stub executable printing "NVIM v0.12.4"; run `bun scripts/record-vim.ts` with NVIM=<stub>
     expect(exitCode).toBe(1); expect(stderr).toContain("requires Neovim 0.11.x");
   });
   ```

   - Run `bun test scripts/record-vim.test.ts` and confirm failure (script missing).

2. **GREEN:** `scripts/record-vim.ts`, `test/vim/cases.ts`, then record

   **Preview:**

   ```ts
   // assertNvim011(nvim): `${nvim} --version` first line must start "NVIM v0.11." else stderr + exit 1
   // recordCase: §7 lines 1801–1811 (spawn --clean --headless --listen, setup, nvim_input, wait not blocking, json_encode)
   // cases: { id, before: { lines, cursor }, keys }[] — motions, operators, text objects, counts,
   //        registers "a–"z and "0–"9, search, :s, :%s, u, Ctrl-r, . (REQ2 list, requirements REQ3@R1)
   ```

   ```text
   # Neovim 0.11.7 prerequisite (local is 0.12.4):
   curl -fsSL -o $TMPDIR/nvim.tar.gz https://github.com/neovim/neovim/releases/download/v0.11.7/nvim-macos-arm64.tar.gz
   tar -xzf $TMPDIR/nvim.tar.gz -C $TMPDIR && NVIM=$TMPDIR/nvim-macos-arm64/bin/nvim bun run record:vim
   ```

   - Do not commit the Neovim binary; commit only `expected.json`.

3. **REFACTOR:** Keep `cases.ts` grouped by REQ2 category with stable ids.

   **Preview:**

   ```ts
   // allowed: reorder/group cases, shared `before` fixtures; prohibited: editing expected.json by hand
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   test(vim): record Neovim 0.11 expectations over RPC

   Task: P1-G2-T3 — Record Neovim 0.11 expectations
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V2.3` — `bun test scripts/record-vim.test.ts` → exit 1 and "requires Neovim 0.11.x".
- `V2.2` (data) — `expected.json.nvim` starts `0.11.` and has one entry per `cases.ts` id (asserted by `vim.test.ts` in T4).

##### P1-G2-T4 — Implement the table-driven vim engine

- **Outcome:** `handleKey` (parser + motion/operator/text-object tables, counts, registers, undo blocks, `.` repeat, search with vim-regex subset, `parseEx`/`exCompletions`) replays every non-ex recorded case exactly; ex cases are marked for routing through `core/state` in P2-G1-T5.
- **System Design:** `W261003HEGE-REQ1@R3, REQ3@R1` → `W261003HEGE-DES3` → `S2` → `V2.1` (non-ex), `V2.2`
- **UI Design:** `None — kernel`
- **Canonical Shapes:** System design §7 `src/core/kernel/**` (lines 1724–1776, engine/types at 1753–1764); parent `rm261003abzp-design.md:544-557`
- **Files:** `src/core/kernel/vim/{types,keys,parser,motions,operators,text-objects,search,ex,engine}.ts`, `test/vim/vim.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V2.1`, `V2.2`:** `test/vim/vim.test.ts`

   **Preview:**

   ```ts
   const rec = await Bun.file("test/vim/expected.json").json();
   test("V2.2 metadata", () => { expect(rec.nvim.startsWith("0.11.")).toBe(true); expect(ids(rec)).toEqual(ids(cases)); });
   for (const c of rec.cases) test(`V2.1 ${c.id}`, () => {
     // replay(c) drives kernel handleKey with a kernel-level harness (buffer + VimState + Registers + UndoHistory);
     // P2-G1-T5 swaps replay to dispatch through createUpdate so ex cases (`:s`, `:%s`) run too.
     const after = replay(c);
     expect(after).toEqual(toKernelCoords(c.after));   // lines, cursor (1-based byte → 0-based UTF-16), mode, registers
   });
   ```

   - Run `bun test test/vim` and confirm failures for missing engine.

2. **GREEN:** `vim/*.ts` — `handleKey`, `parseKeys`, tables, `parseEx`, `exCompletions`

   **Preview:**

   ```ts
   // engine.ts handleKey: §7 lines 1753–1758; VimEffect union: §7 lines 1760–1763 (adds `paste`)
   // Insert keys accumulate one undo block until Esc; `paste` from "+ is emitted, other registers applied in-engine
   // search.ts: vim regex → RegExp (\< \> \{n,m}); invalid → "E486: Pattern not found"
   // ex.ts: parseEx(line) → { cmd, bang, arg }, `:s`/`:%s` parsed here; execution belongs to core/state
   ```

   - Mark ex-only cases with `test.todo` referencing P2-G1-T5 rather than deleting them.

3. **REFACTOR:** One table entry per REQ2 command; remove ad-hoc branches.

   **Preview:**

   ```ts
   // allowed: table consolidation inside vim/*; prohibited: Alfred imports (reference only), non-kernel imports
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(kernel): add table-driven vim engine

   Task: P1-G2-T4 — Implement the table-driven vim engine
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V2.1` (non-ex) — `bun test test/vim` → every non-ex case equal; ex cases listed as todo for P2-G1-T5.
- `V2.2` — `bun test test/vim -t V2.2` → pass.

##### P1-G2-T5 — Add the kernel text view

- **Outcome:** `TextView`, `RenderLine`, `Span`, `StyleToken`, `Widget`, `Decoration`, `DecorationProvider`, `Highlighter`, `layoutText`, `highlightMarks`, `searchMarks`, `selectionMarks` exist at parent shapes; all four decoration kinds lay out; providers see only viewport rows.
- **System Design:** `W261003HEGE-REQ1@R3` → `W261003HEGE-DES7` → `S7, S17` → `V7.4`
- **UI Design:** `None — kernel`
- **Canonical Shapes:** System design §7 `src/core/kernel/view/*` (lines 1826–1869); parent `rm261003abzp-design.md:607-620, 385, 395-397`
- **Files:** `src/core/kernel/view/{types,decorations,text-view,marks}.ts`, `src/core/kernel/view/text-view.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V7.4`:** `src/core/kernel/view/text-view.test.ts`

   **Preview:**

   ```ts
   test("V7.4 no providers → raw lines", …);
   test("V7.4 mark / replace inline / replace block / widget / line sign", () => {
     // synthetic providers returning one decoration of each kind; expect spans and widget rows per parent model
   });
   test("V7.4 viewport only", () => {
     // provider records requested line range; view rows 100–129 of 5,000 → expect no request outside 100–129
   });
   ```

   - Run `bun test src/core/kernel/view` and confirm failure.

2. **GREEN:** `view/*.ts`

   **Preview:**

   ```ts
   // layoutText, searchMarks, selectionMarks: §7 lines 1849–1855
   // highlightMarks(highlighter): DecorationProvider calling highlighter.highlight(buf, visibleLines); catch → []
   ```

   - Span offsets map cursor ↔ source column (invariant §7 line 1866).

3. **REFACTOR:** Isolate per-kind span merging helpers.

   **Preview:**

   ```ts
   // allowed: private helpers in text-view.ts; prohibited: language-specific code in kernel
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(kernel): add text view layout and decorations

   Task: P1-G2-T5 — Add the kernel text view
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V7.4` — `bun test src/core/kernel/view` → all kinds laid out; no out-of-viewport provider requests.

##### P1-G2-T6 — Add file types and windowed highlighting

- **Outcome:** `FileTypeRegistry` (`forPath`: extension → file name → `text`; duplicate registration throws), `EditorKindRegistry`, `textFileType`, `CODE_LANGUAGES` (34 entries), `codeFileTypes`, `lowlightHighlighter` (200-line look-back, `WeakMap<TextBuffer>` cache, failure → no marks), and `markdownFileType` (source view only) exist.
- **System Design:** `W261003HEGE-REQ11@R2, REQ1@R3` → `W261003HEGE-DES6` → `S6, S17` → `V6.1, V6.2, V6.3`
- **UI Design:** `None — core file types`
- **Canonical Shapes:** System design §7 `src/core/filetypes/registry.ts`, `src/core/lang/code/*`, `src/core/lang/markdown/file-type.ts` (lines 1871–1939); parent `rm261003abzp-design.md:654-681`
- **Files:** `src/core/filetypes/registry.ts`, `src/core/filetypes/registry.test.ts`, `src/core/lang/code/{file-types,highlight}.ts`, `src/core/lang/code/{file-types,highlight}.test.ts`, `src/core/lang/markdown/file-type.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V6.1`, `V6.2`, `V6.3`:** registry, table, and highlighter tests

   **Preview:**

   ```ts
   test("V6.1 forPath", () => {
     // scripts/sync.ts→typescript, config.yaml→yaml, notes.txt→text, Makefile→makefile,
     // a.md→markdown (views ["source"]), run.sh→bash, pyproject.toml→ini, Dockerfile→text
   });
   test("V6.2 table integrity", () => {
     // every id ∈ lowlight common; shell, python-repl, plaintext absent; registering a duplicate extension throws
   });
   test("V6.3 windowed highlight", () => {
     // 5,000-line TS buffer generated in-test; lines 400–440 → marks with code* tokens;
     // same buffer twice → same array (cache); throwing grammar → [] and no exception
   });
   ```

   - Run `bun test src/core/filetypes src/core/lang` and confirm failure.

2. **GREEN:** registry, `CODE_LANGUAGES`, `codeFileTypes`, `lowlightHighlighter`, `markdownFileType`

   **Preview:**

   ```ts
   // CODE_LANGUAGES and lowlightHighlighter: §7 lines 1895–1926 (complete the commented languages with conventional extensions)
   // markdownFileType: { id: "markdown", match: { extensions: [".md"] }, editor: "text",
   //                     views: [{ id: "source", decorations: [] }], highlighter: lowlightHighlighter("markdown") }
   ```

   - `lowlight` is imported only under `src/core/lang/code` (boundary rule).

3. **REFACTOR:** Keep `HLJS_TOKENS` mapping as one table.

   **Preview:**

   ```ts
   // allowed: hast → line-span helper extraction; prohibited: per-language special cases outside the table
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(filetypes): add file-type registry, language table, and highlighter

   Task: P1-G2-T6 — Add file types and windowed highlighting
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V6.1` — `bun test src/core/filetypes` → expected ids for all eight paths.
- `V6.2` — `bun test src/core/lang/code/file-types.test.ts` → pass.
- `V6.3` — `bun test src/core/lang/code/highlight.test.ts` → code tokens, cache hit, safe failure.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Kernel and file-type units | `bun test src test/vim scripts/record-vim.test.ts` | V2.1 (non-ex), V2.2, V2.3, V2.4, V6.1–V6.3, V7.4 pass |
| Boundaries | `bun test test/boundaries.test.ts` | V7.1 pass on the kernel tree; V7.2 still pass |
| Fast check | `bun run check` | Exit 0 except `knip` findings allowed by the interim rule (listed in the report) |

#### Review and Verification Focus

- **Specification:** kernel contracts equal parent shapes (G1); `VimEffect` adds only `paste`; no language code in `core/kernel`; 34 languages exactly; Markdown is source-only in DI1; recorder never runs in `check` or CI.
- **Technical:** inclusive/exclusive and linewise semantics; cursor after undo; UTF-16 vs byte columns; viewport-only provider calls; cache keyed by buffer object; highlighter failures contained.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ2@R2 → DES1 → S1 → V1.1, V1.4` | None | `P1-G1` | `P1-G1-T1, P1-G1-T2, P1-G1-T5` |
| `REQ2@R2, REQ4@R3 → DES1, DES14 → S1, S15 → V1.2, V15.1` | None | `P1-G1` | `P1-G1-T2, P1-G1-T3` |
| `REQ12@R1 → DES15 → S16 → V16.2` | None | `P1-G1` | `P1-G1-T3` |
| `REQ1@R3 → DES14 → S7 → V7.1, V7.2` | None | `P1-G1, P1-G2` | `P1-G1-T4` (re-run in every P1-G2 task) |
| `REQ1@R3 → DES3 → S2 → V2.4` | None | `P1-G2` | `P1-G2-T1` |
| `REQ1@R3, REQ10@R2 → DES3, DES13 → S7 → V7.5` (contract only) | None | `P1-G2` | `P1-G2-T2` (proved in P2-G1-T5) |
| `REQ3@R1 → DES3 → S2 → V2.2, V2.3` | None | `P1-G2` | `P1-G2-T3, P1-G2-T4` |
| `REQ1@R3, REQ3@R1 → DES3 → S2 → V2.1` (non-ex) | None | `P1-G2` | `P1-G2-T4` (ex cases: P2-G1-T5) |
| `REQ1@R3 → DES7 → S7, S17 → V7.4` | None | `P1-G2` | `P1-G2-T5` |
| `REQ11@R2 → DES6 → S6, S17 → V6.1, V6.2, V6.3` | None | `P1-G2` | `P1-G2-T6` |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary; later gates are handed off explicitly. G1 is not due here; its Part 1 outputs are handed to P3-G1-T6 for the evidence list.
- Every source obligation is covered.

## Outputs for Later Parts

- `bun run check`, `test:ci`, `bench` script names; `ci.yml` (calls `test:ci` and `bench` that Parts 2–3 populate); `test/boundaries.test.ts`.
- Kernel contracts: `Pos`, `Range`, `Edit`, `TextBuffer`, `UndoHistory`, `Registers`, `WindowTree`, `Key`, `Mode`, `VimState`, `BufferVim`, `VimEnv`, `VimEffect`, `handleKey`, `parseEx`, `exCompletions`, `CommandRegistry`, `Keymap`, `KeyScope`, `defaultBindings`, `layoutText`, `Decoration`, `DecorationProvider`, `Highlighter`, `highlightMarks`, `searchMarks`, `selectionMarks`.
- `FileTypeRegistry`, `EditorKindRegistry`, `textFileType`, `codeFileTypes`, `markdownFileType`, `lowlightHighlighter`.
- `test/vim/vim.test.ts` replay harness with ex cases pending P2-G1-T5.
- `release.yml` smoke expects `so --version` = `so <version>` (P3-G1-T4 `VERSION`).

## Planning Gaps

`None`
