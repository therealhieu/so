# P1-G1 Verification Report

## Scope

- **Group:** `P1-G1`
- **Tasks:** `P1-G1-T1, P1-G1-T2, P1-G1-T3, P1-G1-T4, P1-G1-T5`
- **Report:** `.s1mple/work/done/w261003hege-editor-foundation/reports/p1-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/done/w261003hege-editor-foundation/reports/p1-g1-implementation-report.md` (commit `51c6474`)

Verified range: `03a05d3..23bc489` on `feat/rm261003abzp-di1-editor-foundation`. The group commits are `39d0bcb`, `1af1c80`, `ef11166`, `643225a`, `6fda519`, and `23bc489`. Orchestrator commits `59dff86`, `8790f75`, and `348cf7b` are in the range but are not group work. The working tree was clean at the start of verification.

## Status

`Passed`

Every assigned task, chain, and verification case is met, and every group check passes. `bun run check` stops at knip, which the interim rule allows (see Technical Verification). No material defect was found.

## Assigned Traceability

- **System Design:** `REQ2@R2 → DES1 → S1 → V1.1, V1.2, V1.4`; `REQ4@R3 → DES14 → S15 → V15.1`; `REQ1@R3 → DES14 → S7 → V7.1, V7.2`; `REQ12@R1 → DES15 → S16 → V16.2`. Roadmap: binding `w261003hege-discuss-context.md` Roadmap Binding (RM261003ABZP, PH1@R2, DI1@R2); parent coverage rows "Development, CI, release" (RM261003ABZP-REQ10@R2), "Four layers, kernel rule, boundary test" (RM261003ABZP-DES1@R2), "Toolchain, CI, release" (RM261003ABZP-DES15@R1), and "Boundaries and restore" (RM261003ABZP-S11@R1 / V15@R2, boundary part) in system design §1; gate G1 (`rm261003abzp-roadmap-phase-1-daily-usable-editor.md:73`).
- **UI Design:** `None`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ2@R2 → DES1 → S1 → V1.1` | `None` | Exact npm pins from §7, `packageManager` `bun@1.4.2` as the only Bun source, `bunfig.toml` `exact = true`, committed frozen `bun.lock` | `package.json` equals the §7 shape (scripts, 4 deps, 5 devDeps, `packageManager`, `bin`); `bunfig.toml` `[install] exact = true`; `tsconfig.json` equals §7; `bin/so` mode `100755`, `#!/usr/bin/env bun` → `import "../src/app/main.ts"`; `.gitignore` adds `.so-bench/`; `test/repo.test.ts:20` `exact npm pins` | `Satisfied` |
| `REQ2@R2 → DES1 → S1 → V1.2` | `None` | Every action in all three workflows pinned to a 40-hex SHA with a `# v…` comment | `.github/workflows/{ci,release,release-please}.yml` (10 `uses:` lines plus one local `./` ref); `test/repo.test.ts:31` `SHA-pinned actions`; each SHA matches its upstream tag (see Technical Verification) | `Satisfied` |
| `REQ2@R2 → DES1 → S1 → V1.4` | `None` | Docs record the stack, exact pins, scripts, test layers, PR-only CI, branch `main`, and TS/Biome/knip/`bun test` rules | `.s1mple/docs/project.md` Technology Stack, Scripts, Test Layers, CI Checks, Release; `.s1mple/docs/languages/typescript.md` Toolchain and Configuration, `tsconfig.json` rules table (includes `skipLibCheck` with its reason) | `Satisfied` |
| `REQ4@R3 → DES14 → S15 → V15.1` | `None` | `ci.yml` triggers only on `pull_request` to `main`, with a PR-number concurrency group and `cancel-in-progress`; jobs `check` and `test` (matrix `ubuntu-24.04`, `macos-15`; bench on Linux only) | `.github/workflows/ci.yml:2-7` (`on.pull_request.branches [main]`, `group: ci-${{ github.event.pull_request.number }}`, `cancel-in-progress: true`), `:11-30` jobs; `test/repo.test.ts:44` `CI runs on pull_request only` | `Satisfied` |
| `REQ1@R3 → DES14 → S7 → V7.1` | `None` | `src/**/*.ts` scanned with `Bun.Transpiler.scanImports` against `LAYER_RULES` that encode `rm261003abzp-design.md:50-57` | `test/boundaries.test.ts:16-42` `LAYER_RULES`, `:62` `checkImports`, `:90` `src respects LAYER_RULES` | `Satisfied` |
| `REQ1@R3 → DES14 → S7 → V7.2` | `None` | Both violation fixtures reported | `test/fixtures/boundary-violation/core-imports-fs.ts` (`node:fs`, as `src/core/state/x.ts`), `kernel-imports-markdown.ts` (`../lang/markdown/file-type`, as `src/core/kernel/x.ts`); `test/boundaries.test.ts:99` `violation fixtures are reported` | `Satisfied` |
| `REQ12@R1 → DES15 → S16 → V16.2` | `None` | `release.yml` runs `build` → `smoke` on four native runners → `publish`, which needs `smoke`; triggers are tag `v*` and `workflow_call(tag)`; `release-please.yml` calls it when `release_created`; release-please config equals §7 | `.github/workflows/release.yml:2-9` triggers, `:13` `TAG`, `:32-46` smoke matrix, `:47-48` `publish.needs: smoke`; `.github/workflows/release-please.yml:17-23`; `release-please-config.json` equals §7; `.release-please-manifest.json` `{ ".": "0.0.0" }` | `Satisfied` |
| DEV1 — no work-process identifiers in code | `None` | No Work/REQ/DES/S/V/phase/goal/task IDs in `src/`, `test/`, `scripts/`, `bin/`, workflows; tests named by behavior | Test names: `exact npm pins`, `SHA-pinned actions`, `CI runs on pull_request only`, `src respects LAYER_RULES`, `violation fixtures are reported`; identifier scan has no match | `Satisfied` |
| Roadmap G1 (producer DI1, consumer DI2@R2) | `None` | P1-G1 produces the `bun run check` script and the CI definition; G1 is not due within this goal | `package.json` `scripts.check`; `.github/workflows/ci.yml`; V1.1, V1.2, and V15.1 pass locally. CI green on the merged DI1 PR stays with P3-G1 | `Satisfied` |

Roadmap baseline: `git log -- .s1mple/work/active/rm261003abzp-so-v1/` → only `d00d3a3`, so the parent files are unchanged and still the accepted baseline. The G1 row at `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:73` lists `bun run check` and CI among its required outputs, due before DI2 execution. Parent synchronization stays pending with the main orchestrator; this verification wrote no parent file.

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| Bun runtime | `S1` | `DES1` | `bun --version` | `1.4.2` | `Passed` |
| Frozen install | `S1` | `DES1` | `shasum bun.lock; bun install --frozen-lockfile; shasum bun.lock` | Exit 0, "Checked 48 installs across 124 packages (no changes)"; SHA-1 `b2875887f83913b36b6c1b7fe265947d2b09e8df` before and after; `git status` clean | `Passed` |
| Release-build install (cross-platform) | `S1`, `S16` | `DES1`, `DES15` | Scratch copy of `package.json`, `bun.lock`, `bunfig.toml`: `bun install --frozen-lockfile --os="*" --cpu="*"` | Exit 0, 105 packages; lockfile SHA unchanged; `@opentui/core-{darwin-arm64,darwin-x64,linux-x64,linux-arm64,…}` installed, so `release.yml:22` works with the committed lockfile | `Passed` |
| No range specifiers | `S1` | `DES1` | `grep -E '"[\^~]' package.json` | No output (exit 1) | `Passed` |
| `V1.1` | `S1` | `DES1` | `bun test test/repo.test.ts -t "exact npm pins"` | 1 pass, 2 filtered out, 0 fail. Scratch mutations: `zod` → `^4.6.5` fails; `packageManager` → `bun@1.4.1` fails | `Passed` |
| `V1.2` | `S1` | `DES1`, `DES14` | `bun test test/repo.test.ts -t "SHA-pinned actions"`; `git ls-remote https://github.com/<repo> refs/tags/<tag> refs/tags/<tag>^{}` | 1 pass, 0 fail. Scratch mutations: `checkout@v5` in `release.yml` fails; SHA without `# v5` comment in `release-please.yml` fails. Upstream: `actions/checkout@v5`, `oven-sh/setup-bun@v2.2.0`, `actions/upload-artifact@v4`, `actions/download-artifact@v4`, `googleapis/release-please-action@v5` (peeled) all match the pinned SHAs | `Passed` |
| `V15.1` | `S15` | `DES14` | `bun test test/repo.test.ts -t "CI runs on pull_request only"` | 1 pass, 0 fail. Scratch mutations: added `push` trigger fails; `cancel-in-progress: false` fails; group `ci-${{ github.ref }}` fails | `Passed` |
| Repository policy suite | `S1`, `S15` | `DES1`, `DES14` | `bun test test/repo.test.ts` | 3 pass, 0 fail, 25 `expect()` calls | `Passed` |
| `V7.1` | `S7` | `DES14` | `bun test test/boundaries.test.ts -t "src respects LAYER_RULES"`; scratch copy with `src/core/kernel/bad.ts` importing `node:fs` | In repo: 1 pass (empty `src`). Scratch: fails with `src/core/kernel/bad.ts: node:fs violates no packages allowed` | `Passed` |
| `V7.2` | `S7` | `DES14` | `bun test test/boundaries.test.ts -t "violation fixtures are reported"` | 1 pass, 0 fail (each fixture yields exactly one violation) | `Passed` |
| `LAYER_RULES` vs `rm261003abzp-design.md:50-57` | `S7` | `DES14` | Scratch copy of `test/boundaries.test.ts` with 26 extra probe cases | 28 pass, 0 fail. Allowed: kernel → kernel; filetypes → kernel; `lang/code` → `lowlight`, kernel, filetypes; state → kernel, config, lang; config → `zod`; ui → `@opentui/core`, core; workspace → `node:fs/promises`, `ignore`, core; app → `package.json`, ui, workspace, core. Reported: kernel `import type` and `export type` from filetypes or lang; kernel → package; kernel dynamic `import()` of state; filetypes → lang; lang → state or config; lang → bare `fs`; state → workspace, `bun`, `bun:test`, `@opentui/core`; `src/core/x.ts` → state; ui → workspace; workspace → `@opentui/core` or ui; app → `@opentui/core` or `test/` | `Passed` |
| Boundary suite | `S7` | `DES14` | `bun test test/boundaries.test.ts` | 2 pass, 0 fail, 3 `expect()` calls | `Passed` |
| `V16.2` | `S16` | `DES15` | Parse both release workflows with `Bun.YAML.parse` | `on.push.tags ["v*"]`; `on.workflow_call.inputs.tag {type: string, required: true}`; `env.TAG` = `${{ inputs.tag \|\| github.ref_name }}`; jobs `build`, `smoke` (`needs: build`), `publish` (`needs: smoke`); smoke include `macos-15/darwin-arm64`, `macos-15-intel/darwin-x64`, `ubuntu-24.04/linux-x64`, `ubuntu-24.04-arm/linux-arm64`; release-please `release` job `needs: rp`, `if: release_created`, `uses: ./.github/workflows/release.yml`, `with.tag`, `secrets: inherit` | `Passed` |
| `V1.4` | `S1` | `DES1` | Compare every version in both docs with `package.json` | `project.md` and `typescript.md` give Bun `1.4.2` (`packageManager`), TypeScript `7.0.2`, `@opentui/core` `0.5.14`, `lowlight` `3.3.0`, `zod` `4.6.5`, `ignore` `7.0.12`, `@types/bun` `1.4.2`, Biome `2.5.15`, knip `6.39.0`, `@xterm/headless` `6.0.0`, all equal to `package.json`. Stack, checks, and TypeScript rules are no longer "Not established"; only TypeScript "Error Handling" remains, which V1.4 does not cover | `Passed` |
| Format and lint | `S1` | `DES1` | `bunx biome check .` | "Checked 8 files … No fixes applied", exit 0 | `Passed` |
| Type check | `S1` | `DES1` | `bun --bun run tsc --noEmit -p .` | Exit 0 | `Passed` |
| `bun run check` (interim knip rule) | `S1` | `DES1`, `DES14` | `bun run check` | Biome and tsc pass. knip exits 1 with exactly 4 unused dependencies (`@opentui/core` → P3-G1, `lowlight` → P1-G2, `zod` → P2-G1, `ignore` → P2-G2), 1 unused devDependency (`@xterm/headless` → P3-G1), and 3 configuration hints for entry and project patterns with no files yet. Every finding is a G1 dependency whose consumer is a later group, so the interim rule holds | `Passed` |
| Unit stage behind knip | `S1` | `DES1` | `bun test src test/boundaries.test.ts test/repo.test.ts test/vim` | 5 pass, 0 fail, 28 `expect()` calls | `Passed` |
| DEV1 identifier scan | None | None | `grep -rnE "W26\|RM26\|REQ[0-9]\|DES[0-9]\|\bS[0-9]+\b\|V[0-9]+\.[0-9]\|P[0-9]-G[0-9]\|rm261003\|w261003\|\bPH[0-9]\|\bDI[0-9]\|\bRF[0-9]" test bin .github package.json biome.json knip.json tsconfig.json bunfig.toml release-please-config.json` | No match (exit 1); `src/` and `scripts/` do not exist yet | `Passed` |
| Workflow lint (extra) | `S16` | `DES15` | `actionlint` 1.7.11 | One SC2046 warning at `release.yml:54`, the design's own unquoted `$([[ "$TAG" == *-* ]] && echo --prerelease)`. It must stay unquoted, because quoting it would pass an empty argument to `gh` for non-prerelease tags. No other issue | `Passed` |

Implementer deviations, assessed against the design:

| Deviation | Assessment |
|---|---|
| `biome.json` also ignores `.s1mple`; space indentation; no explicit `rules`; `vcs.useIgnoreFile` | Not material. `.s1mple` holds work documents and parent mockup CSS, not product code, and §4 sets no rule for it. Biome 2.5 applies recommended rules by default |
| Block YAML instead of the design's flow mappings around `${{ }}` | Not material. The parsed structure equals §7 (V15.1 and V16.2 evidence above) |
| `// @ts-nocheck` in the kernel fixture; knip entry excludes the fixtures | Not material. This keeps `tsconfig.json` equal to §7 while the fixture's import stays unresolved on purpose |
| `TYPE_IMPORT` regex adds type-only specifiers; colocated `*.test.ts` skipped | Not material. The regex tightens the rule, and the probe confirms kernel type imports are reported. The skip applies only to test files, which must import `bun:test`. Production modules remain fully scanned |
| `src/app` may import `package.json`; core package policy is a deny-list (runtime, Node builtins, `@opentui/*`); kernel and filetypes import no packages | Not material. The deny-list matches the plan's T4 preview (`src/core/** → no node:*, bun, @opentui/*`), and the `package.json` allowance serves the designed `VERSION` read |
| knip interim findings | Within the interim rule (see above) |

## Findings

None

## Test Coverage

- **Covered:** exact npm pins and `packageManager` (`exact npm pins`); SHA plus version-comment pinning across all workflows (`SHA-pinned actions`); the `pull_request`-only trigger, PR-number concurrency group, and `cancel-in-progress` (`CI runs on pull_request only`); layer and kernel import rules over `src` (`src respects LAYER_RULES`); detection of both violation fixtures (`violation fixtures are reported`). Each policy test was mutation-checked and fails on the targeted regression.
- **Missing:** None. `src respects LAYER_RULES` scans an empty `src` today. It becomes meaningful as P1-G2 onward adds modules, and the scratch probe above shows that it fails on a real violation.

## Scope Changes

The deviations listed in the implementation report (Deviations 1–7 and 9–10) are assessed above. None changes requirements, design shapes, or expected results. The binding user-approved DEV1 rule replaces the plan's `-t V<id>` checks with behavior-named tests, and the implementation report's V-case map was used for every `-t` run. No unplanned file was added: the 19 group files in `git diff --stat 03a05d3 23bc489` (excluding the orchestrator's `.s1mple/S1MPLE.md` and goal edits) equal the plan's Main Files list. `src/**` stays empty as scoped.

## Unverified Items

- GitHub-hosted execution of `ci.yml`, `release-please.yml`, and `release.yml`. That includes runner label availability for `macos-15-intel` and `ubuntu-24.04-arm` and the release-please repository setting that allows Actions to create PRs. These runs belong to V15.2, V15.3, and V16.1 in P3-G1 and cannot run locally. They are outside this group's assigned cases.

## Blockers

None
