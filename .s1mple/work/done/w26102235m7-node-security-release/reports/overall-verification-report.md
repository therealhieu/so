# W26102235M7 Overall Verification Report

## Scope

- **Scope:** `overall`
- **Tasks:** `G1-T1`, `G1-T2` — all tasks
- **Change range:** `7e905f7..576009a`
- **Report:** `.s1mple/work/active/w26102235m7-node-security-release/reports/overall-verification-report.md`

## Status

`Passed`

## Coverage

| REQ | UDES or DES | V | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1` | `DES1` | `V1`, `V2` | `.github/workflows/release.yml:130-136` job `npm`: the existing `actions/setup-node@949feb2… # v7.1.0` step now has `check-latest: true`, with the comment `# check-latest takes the newest 24.x security release, not the runner's cached one.` | `Met` |
| `REQ1` | `DES2` | `V1`, `V2`, `V3` | `.github/workflows/release.yml:82-87` job `channels`: new `actions/setup-node@949feb2… # v7.1.0` step (`node-version: "24"`, `check-latest: true`, `package-manager-cache: false`), placed directly before `npm packages`; the dry run resolved it to `24.22.1` | `Met` |
| `REQ2` | `DES3` | `V1` | `test/repo.test.ts:54-72` `test("npm runs on the latest Node 24")`: parses every workflow with `Bun.YAML.parse`, finds each job's first `run` step matching `/\bnpm\s/`, and requires an earlier `actions/setup-node@` step with `node-version === "24"` and `check-latest === true`; failures are listed as `<file> <job>` | `Met` |

## Checks

| Check | Command or method | Actual result | Result |
|---|---|---|---|
| `V1` | `bun test test/repo.test.ts` at `576009a` | 6 pass, 0 fail. RED was already proven in `reports/g1-verification-report.md`: at `87bbf21` the new test received `["release.yml channels", "release.yml npm"]`. The order check from `9d0f558` (`steps.slice(0, npm)`) is in the range | `Passed` |
| `V2` | `actionlint .github/workflows/release.yml` | Exit 0, no output | `Passed` |
| `V2` | PR #50 checks `zizmor` and `check` (`gh pr checks 50`) | `zizmor` pass (9s); `check` pass (45s); both on head `576009a` | `Passed` |
| `V3` | Release dry run [39736356512](https://github.com/therealhieu/so/actions/runs/39736356512) (`workflow_dispatch`, head `576009a`); `gh run view 39736356512 --log --job 119683015463` | Run conclusion `success`. `channels` log: `node-version: 24`, `check-latest: true`, `Attempt to resolve the latest version from manifest...`, `Resolved as '24.22.1'`, `node: v24.22.1`, `npm: 11.19.1`. The `npm packages` step dry-ran all 5 packages (`(dry-run)`), then `added 2 packages in 3s`, and passed both `so --version` checks. `publish`, `homebrew`, and `npm` were `skipped`, so nothing was published | `Passed` |
| Required PR checks | `gh pr checks 50 --watch --interval 30` | `check`, `test (macos-15)`, and `zizmor` passed on the first run. `test (ubuntu-24.04)` and `audit` needed one rerun each, then passed (see Blockers) | `Passed` |
| Final scope | `git diff --stat 7e905f7..HEAD` | Only `.github/workflows/release.yml` (+8), `test/repo.test.ts` (+20), and files under `.s1mple/work/active/w26102235m7-node-security-release/` changed | `Passed` |

## Integration

- **Shared contract:** both release jobs that run `npm` (`channels`, `npm`) use the same `setup-node` SHA `949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0` with `node-version: "24"` and `check-latest: true`. The repo test enforces this for every workflow, and the existing `SHA-pinned actions` test still passes on the new step.
- **Job boundaries:** in `channels`, `setup-node` runs after the Homebrew step and before `npm packages`, which is the only step there that calls `npm`. The Homebrew step does not call `npm`, so the step order meets `DES2`. `bun add -g` in the same step still runs on Bun and passed in the dry run.
- **Not exercised end to end:** job `npm` runs only on a tag push. `V1` and `actionlint` cover it, as the plan intends (`A6`), and no release was tagged.
- **Final scope:** matches the ship file's Scope. No `src/` file, `ci.yml`, or Bun version changed. A search found no work-process identifiers in `release.yml` or `test/repo.test.ts`.

## Findings

None.

## Test Coverage

- **Covered:** a job that runs `npm` with no `setup-node`, with a `setup-node` that is missing `check-latest: true` or uses a different or unquoted `node-version`, or with `setup-node` after the first `npm` step: `V1` (RED and mutation evidence in the G1 report). Workflow syntax and security posture: `actionlint` and `zizmor` (`V2`). The real `channels` install on the patched Node: `V3`.
- **Missing:** None. Per the Test Strategy, setup-node's own version resolution is deliberately not tested.
- **Low-value:** None.

## Scope Changes

None.

## Blockers and Unverified Items

- **CI reruns:** two required checks failed for reasons unrelated to this change, and each was rerun once with `gh run rerun --failed`.
  - `test (ubuntu-24.04)` failed in `bun run bench` with `error: indexing finished after 196 keys` (`test/bench/indexing-keystroke.bench.ts:56`). That is the runner-speed guard, not a regression, and the change touches no `src/` or bench file. The rerun passed (job `119684372700`, 2m59s).
  - `audit` failed with `POST https://registry.npmjs.org/-/npm/v1/security/advisories/bulk - 503` after 5 minutes. That was a registry outage, not an advisory. The rerun passed (job `119685545732`, 10s).
- **Local `bun run check`:** not used as evidence. The fs-watcher flakes recorded in the ship file's Blockers also reproduce at the base commit. The CI `check` job passed on head `576009a`.
