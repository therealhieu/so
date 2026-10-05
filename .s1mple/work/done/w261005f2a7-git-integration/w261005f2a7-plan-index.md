# W261005F2A7 Implementation Plan Index

## Status

`Ready`

## Sources

- Plan context: `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-plan-context.md`
- System design: `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-system-design.md`
- UI design: `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-ui-design.md` (mockups `ui-mockups/`, manifest `Accepted`)
- System requirements: `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-requirements.md`
- UI requirements: `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-ui-requirements.md`
- Research: `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-research.md`
- Discussion context: `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-discuss-context.md`
- UI context: `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-ui-context.md`

## Roadmap Contract

None — standalone work

## Plan Overview

Build the Git feature bottom-up along the existing one-way `action → update → effect` protocol, so each part ends with a green `bun run check` and a verified, consumable surface for the next part:

1. **Core** — pure Git algorithms (`src/core/features/git/*`), the kernel `changeSign` channel, and all Git state, reducers, commands, and config. No I/O; everything is unit-tested against the system design §8 tree.
2. **Adapters and hand-off** — the only Git-spawning adapter (`src/workspace/git.ts`), the git-dir watcher, the effect-runner Git cases, and the save-gated tool hand-off (`ToolHost`, `holdInterrupts`, suspend-aware shell). Verified with real Git in temp repos and app-level units.
3. **UI, wiring, and delivery** — the gutter change column, statusline segment, explorer markers, hunk float, message `warn` level, theme tokens, `main.ts` construction and deferred detection, e2e, bench, `project.md`, manual terminal checks, and the PR.

`.s1mple/S1MPLE.md` carries into execution as follows:

- **Plan:** not established; s1mple-plan defaults apply.
- **Implementation:** keep it lean; reuse `advanceQuit`, `detectTrash`, `searchMarks`, `noteGroups` patterns; no work-process identifiers (`REQ`/`DES`/`S`/`V`/`UDES`/`UV`, part or group ids) in code, comments, identifiers, test names, or logs.
- **Verification:** not established; use the system design §8 "Test Suites and Cases" tree as canonical (plan context §7) plus the UI design `UV` cases and project checks (`bun run check`, `bun run test:ci`, `bun run bench`, `bun run build`).
- **Delivery:** open a PR from `feat/w261005f2a7-git-integration`, make CI pass, resolve conflicts with `main`; move the work folder `work/active/` → `work/done/` and update `.s1mple/` references; push again and CI must pass on the new head. Never force-push or merge without the user's approval. No release tag.

Every delegated agent reads and follows `.s1mple/S1MPLE.md` and its required references, and kills every process it starts (PTYs, test apps, watchers, temp repos).

## Execution Flow

```text
Plan 1: core → Plan 2: adapters-and-handoff → Plan 3: ui-and-delivery
```

## Plan Parts

| Part | File | Scope | Dependencies | System design | UI design | Verification focus |
|---|---|---|---|---|---|---|
| 1 | `w261005f2a7-plan-1-core.md` | Pure Git algorithms, kernel `changeSign` channel, state types (Git effects carry `repo`), `warn` level, Git reducers and pending gate, commands/bindings/groups, update/save/disk/status/keys/mouse/init hooks, `git` config section, `testRegistries`, temporary no-op Git cases in `src/app/effects.ts` | None | `REQ1`–`REQ9` (core side); `DES1`–`DES13` (core side); `S1`–`S12`, `S16`–`S20`, `S22` (core side), `S24`, `S26` (notice), `S27`–`S29`, `S32`, `S34`–`S36`; `V1`–`V27`, `V31`, `V32`, `V34`, `V35`, `V43`, `V63`, `V66`, `V68`, `V69` | `UREQ1`–`UREQ10` (core side); `UDES1`–`UDES10` (data and wording); `US1`–`US10` (data and gate side); `UV5`, `UV10` (core gate), `UV11`, `UV12`, `UV13` (reducer part) | Diff/patch/status/blame correctness, block-row `changeSign` inheritance, pending-gate transitions, notice catalogue wording and levels, v1 behavior unchanged |
| 2 | `w261005f2a7-plan-2-adapters-and-handoff.md` | `src/workspace/git.ts`, `git-watcher.ts`, `test/support/git-repo.ts`; effect-runner Git cases replacing the temporary no-op cases; `main.ts` construction of `git`, `watchGit`, deferred `detect`, and late-bound `tool`; `startApp` deps; `ToolHost`, `holdInterrupts`, shell `flush/suspend/resume/resetForeignModes` and paint guard, mounted-shell observability, `test/ui/git.test.ts` (created); integration suite | 1 | `REQ1`, `REQ2`, `REQ3`, `REQ4` (adapter side), `REQ6`, `REQ7`, `REQ9` (runner side); `DES1`, `DES3`, `DES4`, `DES6`–`DES9`, `DES11` (adapter side); `S1`–`S3`, `S5`, `S11`–`S16`, `S20`–`S27`, `S29`–`S31`, `S35`; `V28`–`V30`, `V33`, `V36`–`V42`, `V54`–`V60`, `V62`, `V67` | `UREQ10`; `UDES10` (shell side); `US10` (mechanics) | Real-Git stage incl. CRLF/untracked/stale oid, no index writes, watcher retarget and failure tolerance, hand-off ordering and interrupt hold |
| 3 | `w261005f2a7-plan-3-ui-and-delivery.md` | Gutter change column, statusline segment, explorer markers, `HunkView` and registration, `messageWarn`, 17 theme tokens and `theme.test.ts`, production `registries()` merge in `main.ts`, UI suite, e2e, bench and `bench-gate`, `project.md`, full checks, manual checks, PR and delivery | 1, 2 | `REQ1`–`REQ9` (UI, wiring, and final checks); `DES2`, `DES8`–`DES13` (UI, wiring, and perf side); `S7`–`S11`, `S13`–`S15`, `S19`, `S26`, `S31`–`S36` (and `S1`–`S36` via the final checks); `V44`–`V47`, `V50`–`V53`, `V61`, `V64`, `V65` | `UREQ1`–`UREQ12`; `UDES1`–`UDES12`; `US1`–`US12`; `UV1`–`UV4`, `UV6`–`UV10`, `UV13` (snapshot part), `UV14`–`UV18` | v1 byte-identical outside a repo, paint/hit-test/cursor agreement, float layout, statusline drop order, keystroke P95, PTY hand-off, CI green before and after the folder move |

All IDs above are `W261005F2A7-` prefixed at their current revisions (`REQ1@R2`, `REQ2@R2`, `REQ3@R1`, `REQ4@R3`, `REQ5@R2`, `REQ6@R2`, `REQ7@R2`, `REQ8@R1`, `REQ9@R1`; UI ids `@R1`). `V` membership follows system design §8 "Test Suites and Cases"; `V48` and `V49` do not exist there. `V60` and `V67` are owned by Part 2 and re-run by Part 3's `test/ui` checks.

## Group Layout

| Group | Shared context | Split rule |
|---|---|---|
| `P1-G1` | `src/core/features/git/{diff,index-text,patch,status,blame,signs}.ts` + tests; `src/core/kernel/view/{types,decorations,text-view}.ts` + `text-view.test.ts`; `Hunk`, `IndexText`, `RepoStatus`, `BlameLine`, `Decoration.changeSign` contracts; pure unit checks | `First group` |
| `P1-G2` | `src/core/state/{types,result,git,git-commands,update,save,disk,status,keys,mouse,init}.ts`, `src/core/config/schema.ts`, `test/support/state.ts`, `src/app/effects.ts` (temporary no-op Git cases only) + `git.test.ts`, `git-commands.test.ts`, `status.test.ts`, `schema.test.ts`; `GitState`, `GitPending`, Action/Effect/TimerId/Overlay unions, notice catalogue; reducer checks | `Checkpoint — reducers consume the verified algorithm contracts from P1-G1 (hunks, patch, status, signs); a defect there would ripple through every reducer test` |
| `P2-G1` | `src/workspace/{git,git-watcher}.ts` + tests, `test/support/git-repo.ts`, `src/app/effects.ts` Git cases + `effects.test.ts`, `src/app/main.ts` (`git`/`watchGit` construction, deferred `detect`), `test/integration/helpers.ts`, `test/integration/git.test.ts`; `Git`/`GitWatcher` contracts; real-Git and real-fs checks | `Ordered phase — adapters and runner cases consume the Part 1 Action/Effect unions and must be verified before the hand-off and UI wiring use them` |
| `P2-G2` | `src/app/{tool-host,lifecycle}.ts` + tests, `src/app/effects.ts` `runTool` case + `effects.test.ts`, `src/app/main.ts` (late-bound `deps.tool`), `src/ui/shell.ts` flush/suspend/resume/resetForeignModes/paint guard/`FOREIGN_MODES_RESET`, `test/support/ui.ts` observability, `test/ui/git.test.ts` (created), `test/integration/{helpers,git.test}.ts` (tool double, post-tool reload); `ToolHost`/`Shell` extension contracts; hand-off ordering checks | `Too large — P2-G1 and P2-G2 together are 9 tasks and about 20 changed files; the terminal hand-off seam shares only the runner and main.ts wiring lines with the Git adapter and watcher, and none of their checks` |
| `P3-G1` | `src/ui/editors/text-view.ts`, `src/ui/views/{statusline,explorer,cmdline}.ts`, `src/ui/overlays/hunk.ts`, `src/ui/theme.ts` + `theme.test.ts`, `src/ui/shell.ts` `HunkView` registration, `src/app/main.ts` (production `registries()` only), `test/ui/git.test.ts` (extended), `test/e2e/git-tool.test.ts`, `test/bench/git-diff.bench.ts`, `scripts/bench-gate.ts`, `.s1mple/docs/project.md`; mounted-shell snapshots, PTY, bench, full project checks, manual checks, delivery | `Ordered phase — UI surfaces and main wiring consume every Part 1 and Part 2 contract; delivery follows the final verified state` |

`P1-G2` is near the 15-file guideline (about 17 changed files) but is one reducer context; splitting it would separate reducers from the union and catalogue they share. `src/app/effects.ts` and `src/app/main.ts` are edited in several groups so that `tsc` stays green at every group end: P1-G2 adds the temporary no-op cases, P2-G1 and P2-G2 replace them and wire `main.ts`, and P3-G1 only merges production `registries()`.

## Cross-Part Coordination

| Boundary | Producing part | Consuming part | Coordination requirement |
|---|---|---|---|
| `Action`/`Effect`/`TimerId`/`Overlay` git members, `GitState`, `RepoInfo`, `IndexEntry`, `GitPending`, `StageReport`, `ToolResult` (`src/core/state/types.ts`) | 1 | 2, 3 | Runner cases, `ToolHost`, and UI views use exactly these shapes; no parallel types |
| `repo: RepoInfo` on the `gitStatus`, `gitReadIndex`, `gitStage`, and `gitBlame` effects | 1 | 2 | The runner passes `e.repo` to `Git` methods and holds no Git state (system design §7 `src/app/effects.ts`: `repo()` reads `RepoInfo` from the effect payload); reducer tests and runner tests use the same field |
| Temporary no-op cases for the six Git effect kinds in `src/app/effects.ts` | 1 | 2 | P2-G1 replaces `gitStatus`, `gitReadIndex`, `gitStage`, `gitBlame`, `gitWatch`; P2-G2 replaces `runTool`; none remain at the end of Part 2 |
| `parseStatus`, `RepoStatus`, `parseBlame`, `hunkPatch` (core) | 1 | 2 | Adapter returns raw output parsed by core functions; patch text built only in core and passed on stdin |
| `MessageLevel` with `warn`; notice catalogue constants in `src/core/state/git.ts` | 1 | 3 | `cmdline.ts` maps `warn` → `messageWarn`; UI tests assert catalogue text verbatim |
| `hunkSigns`, `GIT_SIGNS`, `RenderLine.changeSign`, `explorerMarkers`, `StatusSegments.git` | 1 | 3 | UI only paints derived state; glyphs and markers come from core |
| `gitCommands`, `gitBindings`, `gitGroups` | 1 | 3 | Merged in `testRegistries()` (Part 1) and production `registries()` in `main.ts` (Part 3) |
| `ConfigSchema.git.tool` | 1 | 2, 3 | `ToolHost` and `main.ts` read the parsed config value |
| `Git`, `createGit`, `GitWatcher`, `watchGitDirs`, `RunnerDeps.git/watchGit` | 2 | 3 | Part 2 constructs them in `main.ts` and runs `detect` after the first frame; Part 3's UI, e2e, and bench suites use that wiring unchanged |
| `ToolHost`, `createToolHost`, `holdInterrupts`, `Shell.flush/suspend/resume/resetForeignModes` | 2 | 3 | Part 2 late-binds `deps.tool` in `main.ts`; Part 3's e2e drives the same path; `HunkView` registration in `shell.ts` must not disturb the paint guard |
| `test/support/ui.ts` test-shell recorders, `test/support/git-repo.ts`, `startApp` deps | 2 | 3 | UI and e2e suites reuse these helpers unchanged |

## Coverage

| Source item | Covered by parts | Expected outcome |
|---|---|---|
| `W261005F2A7-REQ1@R2` | 1, 2 | Only stage hunk and reset hunk write; conflict refusal, oid guard, intent-to-add, EOL/EOF handled |
| `W261005F2A7-REQ2@R2` | 2, 3 | Tool runs full screen with so suspended; interrupts held; foreign modes reset; refresh after exit |
| `W261005F2A7-REQ3@R1` | 1, 2 | `git.tool` configurable; missing tool and no-repo notices without suspend |
| `W261005F2A7-REQ4@R3` | 1, 2, 3 | Signs in own column, navigation, preview, stage/reset, statusline, explorer, blame, which-key titles |
| `W261005F2A7-REQ5@R2` | 1, 3 | Live buffer vs normalized index, bounded Myers, 100 ms debounce, untracked sign; keystroke P95 within gate |
| `W261005F2A7-REQ6@R2` | 1, 2 | Coalesced lock-free refresh; first-level git-dir watch with retarget and failure fallback |
| `W261005F2A7-REQ7@R2` | 1, 2, 3 | Subfolder, worktree, unborn, Git ≥ 2.31 gate; detection after first frame; silent without Git |
| `W261005F2A7-REQ8@R1` | 1 | Dirty buffers saved before the tool; failed or blocked save cancels |
| `W261005F2A7-REQ9@R1` | 1, 2 | Stage saves first; failed save stages nothing |
| `W261005F2A7-DES1`–`DES13`; `S1`–`S36`; `V1`–`V47`, `V50`–`V69` (no `V48`/`V49` in system design §8) | 1, 2, 3 | Every decision implemented; every success criterion and §8 verification case passes with evidence |
| `W261005F2A7-UREQ1@R1`–`UREQ12@R1` → `UDES1@R1`–`UDES12@R1` → `US1@R1`–`US12@R1` → `UV1@R1`–`UV18@R1` | 1, 2, 3 | UI per UI design §7; `UV15`, `UV16` manual checks recorded, unchecked terminals reported as skipped |
| Layer boundaries (`test/boundaries.test.ts`), no new dependency, knip zero, no work-process ids in code | 1, 2, 3 | `bun run check` green at every group end |
| `.s1mple/docs/project.md` update (git config key, module map, min Git 2.31) | 3 | Project baseline reflects the feature |
| Delivery per `.s1mple/S1MPLE.md` | 3 | PR open, CI green, folder moved to `work/done/`, CI green on new head; no merge or force-push without approval |

## Overall Verification

| Check | Command or method | Expected result |
|---|---|---|
| Static and unit gate | `bun run check` | biome, tsc, knip zero findings, all unit suites pass |
| CI suites | `bun run test:ci` | component, integration, UI, and e2e suites pass, including existing v1 snapshots byte-identical |
| Bench gate | `bun run bench` | `gitDiffKeystrokeP95` ≤ 24 ms and existing targets hold (relax with quick speedups rather than block, per project practice) |
| Build | `bun run build` | `dist/so` produced |
| Manual terminal checks | Ghostty with tui-test monitor; kitty, iTerm2, Terminal.app when available | `V61`, `UV15`, `UV16` observations written; unavailable terminals reported as skipped |
| Boundary and process hygiene | `test/boundaries.test.ts`; `grep` for `W261005F2A7\|DES[0-9]\|REQ[0-9]\|UV[0-9]` in `src/` and `test/` | No violations; no work-process ids in code |
| CI on PR | GitHub Actions on the PR, before and after the `work/done/` move | Green on both heads |

## Completion Criteria

- Every listed plan part is implemented and verified.
- Every system and applicable UI design chain and binding constraint has complete coverage.
- Cross-part coordination is integrated and verified.
- All overall verification checks pass.

## Planning Gaps

None
