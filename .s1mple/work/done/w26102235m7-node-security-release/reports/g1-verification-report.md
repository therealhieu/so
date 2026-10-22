# W26102235M7 G1 Verification Report

## Scope

- **Scope:** `G1`
- **Tasks:** `G1-T1`, `G1-T2`
- **Change range:** `7e905f7..9abb8c8`
- **Report:** `.s1mple/work/active/w26102235m7-node-security-release/reports/g1-verification-report.md`

## Status

`Failed`

## Coverage

| REQ | UDES or DES | V | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1` | `DES1` | `V1`, `V2` | `.github/workflows/release.yml:130-136` job `npm` `actions/setup-node@949feb2…` with `node-version: "24"`, `check-latest: true`, and the comment `# check-latest takes the newest 24.x security release, not the runner's cached one.` | `Met` |
| `REQ1` | `DES2` | `V1`, `V2` | `.github/workflows/release.yml:82-87` job `channels` new `actions/setup-node@949feb2… # v7.1.0` step with `node-version: "24"`, `check-latest: true`, `package-manager-cache: false`, placed directly before `npm packages` | `Met` |
| `REQ2` | `DES3` | `V1` | `test/repo.test.ts` `test("npm runs on the latest Node 24")`: parses every workflow with `Bun.YAML.parse`, flags each job whose `run` matches `/\bnpm\s/` and whose first `actions/setup-node@` step lacks `node-version: "24"` and `check-latest: true`, reporting `<file> <job>` | `Met` (see `G1-VER1` for an ordering gap outside the written `DES3`) |

`V3` (release dry run) belongs to overall verification and was not run.

## Checks

| Check | Command or method | Actual result | Result |
|---|---|---|---|
| `V1` RED | T1 state (`87bbf21`: new test + base `release.yml`) exported with `git archive` to a scratch directory; `bun test test/repo.test.ts` | 5 pass, 1 fail; `npm runs on the latest Node 24` received `["release.yml channels", "release.yml npm"]` — matches the implementer's RED claim | `Passed` |
| `V1` GREEN | `bun test test/repo.test.ts` at `9abb8c8` | 6 pass, 0 fail, 58 `expect()` calls | `Passed` |
| `V2` actionlint | `/opt/homebrew/bin/actionlint .github/workflows/release.yml` | No output, exit 0 | `Passed` |
| `V2` zizmor (local) | `uvx zizmor --offline .github/workflows/release.yml` (zizmor 1.31.1) | `No findings to report. Good job! (1 ignored, 13 suppressed)`; the PR `zizmor` job remains the required run | `Passed` |
| `V2` PR checks | PR `zizmor` and `check` jobs | Branch not pushed; no PR yet | `Unverified` (orchestrator, overall) |
| `G1` check | `bun run check` (run twice, load average ~6.2–7.0) | Biome (584 files), `tsc`, and `knip` pass; unit suites fail 4 then 3 tests, all in `src/workspace/watcher.test.ts` and `src/workspace/git-watcher.test.ts` (fs-watcher event counts under load); `test/repo.test.ts` passes | `Failed` (unrelated to the diff; see Blockers) |
| Mutation probe | Scratch copy of `9abb8c8` `release.yml` with job `channels`'s `setup-node` moved after `npm packages`; `bun test test/repo.test.ts` | 6 pass, 0 fail — the test does not catch it | See `G1-VER1` |

## Integration

Not applicable — group scope

## Findings

### G1-VER1 — Minor — test gap — The guard accepts a `setup-node` step that runs after `npm`

- **Builds:** `REQ2`, `DES3`, `V1`, `G1-T1`
- **Evidence:** `test/repo.test.ts` `test("npm runs on the latest Node 24")` looks up any `setup-node` step in the job, without regard to position:

  ```ts
  if (!steps.some((step) => /\bnpm\s/.test(step.run ?? ""))) continue;
  const node = steps.find((step) =>
    step.uses?.startsWith("actions/setup-node@"),
  )?.with;
  ```

  Moving job `channels`'s `setup-node` step below `npm packages` in a scratch copy of `release.yml` left the suite at 6 pass, 0 fail.
- **Impact:** A later edit that reorders steps or appends `setup-node` at the end of a job would run `npm` on the image's or toolcache's Node, which is the exact regression the Test Strategy prioritizes ("a job running `npm` on an old or unpinned Node"), and `bun run check` would still pass. Both jobs are correctly ordered today, so nothing ships wrong now.
- **Resolution:** Require the pinned `setup-node` step to come before the first step whose `run` calls `npm` in that job (e.g. compare `findIndex` of the first `npm` run step with `findIndex` of the `setup-node` step), still reporting `<file> <job>`.
- **Proof to close:** `bun test test/repo.test.ts` passes at the fix commit, and the same test fails naming `release.yml channels` when that job's `setup-node` step is moved after `npm packages`.

## Test Coverage

- **Covered:** Every workflow job that runs `npm` must have an `actions/setup-node` step with the string `node-version: "24"` (an unquoted `24` parses as a number and fails) and `check-latest: true`; RED confirmed for both release jobs, GREEN after the workflow change. `actionlint` and zizmor cover workflow syntax and security posture.
- **Missing:** Step ordering of `setup-node` relative to the first `npm` step (`G1-VER1`). The actual resolved Node version is left to `V3`, as the Test Strategy intends.
- **Low-value:** None.

## Scope Changes

None. The diff touches only `.github/workflows/release.yml` jobs `channels` and `npm` and `test/repo.test.ts`, as planned. No work-process identifiers appear in code, comments, or test names; task IDs appear only in commit bodies.

## Blockers and Unverified Items

- `bun run check` exits 1 locally only on fs-watcher tests in `src/workspace/watcher.test.ts` and `src/workspace/git-watcher.test.ts` (e.g. `a commit notifies within a second, including a linked worktree, and lock files never do`: expected 0 notifications, received 16) at load average ~6–7. The diff changes no `src/` file, and the implementer reproduced the same failures at base `7e905f7`, so they cannot come from this change; the PR's CI `check` job is the authoritative run.
- PR checks `zizmor` and `check` are unverified until the branch is pushed (overall verification).
