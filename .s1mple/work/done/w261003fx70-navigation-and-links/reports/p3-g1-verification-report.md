# P3-G1 Verification Report

## Scope

- **Group:** `P3-G1`
- **Tasks:** `P3-G1-T1`, `P3-G1-T2`, `P3-G1-T3`, `P3-G1-T4`, `P3-G1-T5`
- **Report:** `.s1mple/work/done/w261003fx70-navigation-and-links/reports/p3-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/done/w261003fx70-navigation-and-links/reports/p3-g1-implementation-report.md`

Change range inspected: `d70beaf` → `ce836ae` (commits `b74f24b`, `c7a8663`, `a840918`, `25dee67`, `380d5cc`, `df5aefc`, `ce836ae`), plus report commit `fb2c5d0`, which is the PR head. Verification ran on `fb2c5d0` (macOS arm64, Bun 1.4.2) on 2026-10-04.

## Status

`Failed`

All group checks pass, and V48 and V52–V54 hold. The delivery steps follow `.s1mple/S1MPLE.md`, and G2/G3 are correctly reported as `Pending`. One Major finding remains: at 10,000 notes, each key typed after `[[` costs about 17 ms on the reference machine, which is above the 16 ms keystroke budget. No benchmark covers this case, because `df5aefc` changed the V50 bench to type prose.

## Assigned Traceability

- **System Design:** `W261003FX70-REQ1, REQ3, REQ4 → DES1, DES10 → S1, S3, S5, S11, S13, S19, S20, S21 → V48, V49, V50, V51, V52, V53, V54` (T3 documentation also covers DES2/DES4/DES7/DES8 project facts)
- **UI Design:** `None`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1, REQ3, REQ4 → DES10 → S5 → V49` | None | 10,000-note fixture; real process in a PTY; firstFrame < 200 ms and indexReady < 3 s, recorded on Linux CI; gate fails above 2× | `test/fixtures/generate.ts:makeNoteWorkspace, notePath` (seeded mulberry32, 100 notes per folder, two levels, frontmatter tags/aliases, headings, wikilinks with heading and alias, Markdown link, nested tags, block id); `test/bench/startup.bench.ts` (spawn → first statusline mode / `◆ index ready`, empty `XDG_CONFIG_HOME`); `scripts/bench-gate.ts:TARGETS` `firstFrame: 200`, `indexReady: 3000`. Local medians 117.81 / 900.73 ms. Linux CI on the PR head `fb2c5d0` (run 37151223129): 130.40 / 2106.61 ms | `Satisfied` (see Unverified Items for run-to-run variance) |
| `REQ1, REQ3, REQ4 → DES10 → S5 → V50` | None | 200 keys typed while the status is `indexing` with the real worker; p95 ≤ 16 ms; gate fails above 2× | `test/bench/indexing-keystroke.bench.ts` (real `createIndexHost`; throws if indexing ends before 200 keys; prints `max` and `batches`); `scripts/bench-gate.ts:TARGETS.indexingKeystrokeP95: 16`. Local median 1.58 ms; Linux CI on `fb2c5d0` 5.87 ms. The bench types prose only, and link typing during indexing is above budget (P3-G1-VER1) | `Mismatch` |
| `REQ1, REQ3, REQ4 → DES10 → S5, S3 → V51` | None | openFile ≤ 100 ms and sourceKeystrokeP95 ≤ 32 ms (gate) with `parseDoc` active | Unchanged `test/bench/{open-file,source-keystroke}.bench.ts` run by the gate. Local 24.56 / 4.02 ms; Linux CI `fb2c5d0` 46.12 / 6.11 ms | `Satisfied` |
| `REQ1, REQ4 → DES1, DES4 → S1, S11 → V52` | None | `tsc` passes with the exhaustive switch; `bun run build` compiles main and worker | `bun run check` (includes `tsc`) exit 0; `bun run build` → `bun build --compile src/app/main.ts src/workspace/index-worker.ts --outfile dist/so`, 325 modules, `dist/so` compiled | `Satisfied` |
| `REQ2 → DES2, DES7 → S19 → V53` | None | knip zero findings, worker as an entry | `knip.json` `entry` lists `src/workspace/index-worker.ts`; knip runs inside `bun run check` (exit 0) | `Satisfied` |
| `REQ3, REQ7, REQ10 → DES2, DES7, DES11 → S3, S13, S21 → V54` | None | No `Bun.TOML`, `"buffer.write"`, `"<leader>": " "`, or `TABSTOP` in `src`/`test`; no `ft.analyze(`/`analyses` in `src/ui` | `test/repo.test.ts:OBSOLETE` table plus test "no obsolete references remain": it scans every `{src,test}/**/*.ts` except `test/repo.test.ts` itself, with no excluded source folders; passes in `bun run check` | `Satisfied` |
| `REQ1 → DES1, DES2, DES3, DES9 → S20 → V48` | None | DI1 suites (parent V1@R1, V17@R1, V18@R1) pass on both CI runners, unchanged except planned additions | Local: 43 pass across 6 files. `git diff main` on those files touches only `test/e2e/quit.test.ts` (one new session test from `d54b648`, plus an import-list reflow) and `test/ui/file-ops.test.ts` (the planned V45 cases). CI: `test (ubuntu-24.04)` and `test (macos-15)` green on `fb2c5d0` | `Satisfied` |
| Startup order (T2; DES4, DES7, DES8; S5 invariant) | None | registries → logger → index host → runner → store → `configLoaded` → `stateLoaded` → `shell.attach` → lifecycle → `setImmediate` (watcher + `indexHost.start`) | `src/app/main.ts:212` `createLogger`, `:216` `registries()`, `:222` `createIndexHost`, `:245` `createEffectRunner`, `:247` `createStore`, `:261` `stateLoaded`, `:265` `shell.attach`, `:268` `installLifecycle`, `:280-285` `setImmediate` with `watchWorkspace` and `indexHost.start`. The file is unchanged in the range. Logger before registries has no observable effect, because registries are pure | `Satisfied` |
| Docs (T3): DES2, DES4, DES7, DES8, DES10 project facts | None | `.s1mple/docs/project.md` records the seven pins and homes, the worker entrypoint, `SO_LOG`, config/state/log paths, and bench targets | Cross-checked against `package.json` (all versions exact and matching), `knip.json`, `release.yml:25-26` (both loops list the worker), `config-file.ts:18-21`, `state-file.ts:17-37,62-81` (`0700` folder, `0600` file, first 16 hex of sha256), `log.ts:20-35`, `bench-gate.ts:TARGETS`. Every checked fact matches. The document contains no work-process IDs as rules | `Satisfied` |
| Delivery (T5): `.s1mple/S1MPLE.md` Delivery | None | PR open with CI green; folder moved with references updated; pushed again with CI green; no force-push or merge | PR #2 is `OPEN`, base `main`, `mergedAt: null`, head `fb2c5d0`. `gh pr checks 2` shows 4 passed, 0 failed. Run 37151223129 (head `fb2c5d0`) and run 37151048366 (head `ce836ae`, the post-move head) are both green. The folder is at `.s1mple/work/done/w261003fx70-navigation-and-links`; system design, requirements and discuss context are pure renames (R100). `rg -n "work/active/w261003fx70" .s1mple` matches only instructional text describing the old path pattern. History is linear from `d70beaf`, with no rewrite | `Satisfied` |
| Gates G2/G3 (plan part 3 Cross-Work Gates) | None | Output paths and symbols on the PR head plus the listed V results; both `Pending` until merge | The implementation report lists the G2 outputs (`parseDoc`, `syntaxExtensions`, `markdownFileType`, `linkBindings` Markdown scope, `NoteIndex`, `resolveLink`, `statusSegments`/`Statusline`, `pickerSources`/`PickerView`) and the G3 outputs (`PREVIEW_MIN_COLS`, `PromptView`, `NoteSummary`, `FileTypeRegistry`, `editorViews`, `search`/`write`/`applyEdits` effects). The covering V suites run inside `bun run check` and `bun run test:ci`, both green on `fb2c5d0`. Both gates are reported `Pending`, and neither is claimed satisfied | `Satisfied` |
| Roadmap binding and parent read-only | None | Parent sources under `.s1mple/work/done/rm261003abzp-so-v1/` unedited; baseline before T5 recorded | `git log 2f907fa..HEAD -- .s1mple/work/done/rm261003abzp-so-v1/` is empty, and `git diff d70beaf fb2c5d0` on that path is empty. The goal's "Before `P3-G1-T5`" row was recorded at `ad5e969` (committed in `d70beaf`) before PR creation, with `origin/main` = `c98aa19` as an ancestor. Parent sync rows 1–9 and the DI2 PR/stage rows are reported as pending, without authorization | `Satisfied` |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| Lockfile | `S19` | `DES2, DES7` | `bun install --frozen-lockfile` | exit 0, "no changes" | `Passed` |
| Fast gate (incl. V52 `tsc`, V53 knip, V54) | `S1, S3, S13, S19, S21` | `DES1, DES2, DES7, DES11` | `bun run check` (timed) | exit 0; 621 pass, 0 fail, 53 files; 3.37 s real (< 30 s) | `Passed` |
| `V48` + full suites | `S20` | `DES1, DES2, DES3, DES9` | `bun run test:ci`; then `bun test` on the six DI1 suite files | 115 pass, 0 fail (19 files); DI1 suites 43 pass, 0 fail | `Passed` |
| `V52` build | `S1, S11` | `DES1, DES4` | `bun run build` | 325 modules bundled; `dist/so` compiled with both entrypoints | `Passed` |
| `V49` | `S5` | `DES10` | `bun run bench` (local); `gh run view 37151223129 --log` | Local firstFrame 117.81 ms, indexReady 900.73 ms. Linux CI on the PR head: 130.40 ms, 2106.61 ms. Both are below target | `Passed` |
| `V50` | `S5` | `DES10`, `DES4` | `bun run bench`; 5 direct runs of `test/bench/indexing-keystroke.bench.ts`; probe with the pre-fix `note-index.ts` (from `d70beaf`) in a scratch worktree | Gate median 1.58 ms locally and 5.87 ms on Linux CI. Direct runs: p95 1.38–1.92 ms, max 7.2–12.8 ms, `batches` 4 of 200 keys. With the pre-fix NoteIndex the bench aborts ("indexing finished after 144 keys"), so a severe batch regression fails the gate. Link typing is not measured (P3-G1-VER1) | `Failed` |
| `V51` | `S5, S3` | `DES10`, `DES2` | `bun run bench` | openFile 24.56 ms, sourceKeystrokeP95 4.02 ms locally; 46.12 / 6.11 ms on Linux CI `fb2c5d0` | `Passed` |
| Link-completion keystroke cost at 10,000 notes | `S5` | `DES9`, `DES10` | Scratch probe: `mountShell` + real `createIndexHost` on `makeNoteWorkspace`; wait for `ready`; time each key (dispatch → `renderOnce`) for prose and for `[[note-0004`; 3 runs | Prose median 0.6 ms. Keys after `[[`: 15.1–20.8 ms each, median 16.8 / 17.5 / 17.7 ms per run | `Failed` |
| `V54` red check | `S3, S13, S21` | `DES2, DES7, DES11` | Inspection of `test/repo.test.ts:OBSOLETE` and the implementer's planted-reference evidence | Table form with no source-folder exclusions; the only skipped file is the pattern file itself. `ft.analyze(` and `analyses` are scoped to `src/ui/` as designed | `Passed` |
| `NoteIndex` copy-on-write change (`b74f24b`) | `S6` (V10 rebuild equality, regression) | `DES3` | Code inspection of `note-index.ts:sortedIndex, editLists, writable, addPath, removePath`; `bun run check` | Lists shared with the previous index are copied before their first mutation (`own` set), and the returned index's arrays are never mutated afterwards. Binary search keeps lists sorted, and a key with an emptied list is deleted. V10 and every links/state unit test pass | `Passed` |
| E2E `ready` change (`380d5cc`) | `S20` | None | Inspection of `test/e2e/pty.ts:startFile, statusRow, ready`; `bun run test:ci` | Waits for the start file's basename in the statusline. With no file argument (startup bench, `binary-index`) it falls back to the old condition. Green on both runners | `Passed` |
| Benches stay out of `check` | `S5` | `DES10` | `package.json` scripts | `check` runs `bun test src test/boundaries.test.ts test/repo.test.ts test/vim`; `test/bench` is not included | `Passed` |
| No work-process IDs in code | None | `.s1mple/S1MPLE.md` Implementation | `git diff d70beaf ce836ae -- scripts src test` grepped for REQ/DES/V/S/P-G/W/RM/DI/phase identifiers | No matches. Traceability appears only in commit bodies | `Passed` |
| PR CI on final head | `S5, S20` | `DES10` | `gh pr checks 2`; `gh run view 37151223129` | `check`, `test (ubuntu-24.04)` (test:ci + bench), `test (macos-15)`: all success on `fb2c5d0` | `Passed` |

## Findings

### P3-G1-VER1 — Major — Performance — Typing a link at 10,000 notes exceeds the keystroke budget, and no bench gates it

- **System Design:** `W261003FX70-REQ1, REQ3, REQ4 → DES9, DES10 → S5 → V50` (parent RM261003ABZP-V13@R1: "keystrokes during indexing still meet the V12 budget"; RM261003ABZP-V12@R2: p95 < 16 ms on the reference machine)
- **UI Design:** `None`
- **Evidence:**
  - The scratch probe ran on the PR head with the real worker on `makeNoteWorkspace` (10,000 notes) and the index ready. Keys typed after `[[` cost 15.1–20.8 ms each, with per-run medians of 16.8, 17.5 and 17.7 ms. Prose keys cost 0.6 ms. Both medians are above 16 ms on the reference machine.
  - The first V50 bench (`c7a8663`) typed `[[note-00042]] #idea` during indexing and failed the Linux gate with a 43.73 ms median p95 (run 37150055331, limit 32 ms).
  - `df5aefc` switched the bench to prose. The gate now passes at 1.58 ms locally and 5.87 ms on Linux CI. However, no bench or test now exercises link completion at scale.
  - The cost is in `src/core/state/completion.ts:noteItems`. On every key it computes `linkText` for every note, builds and sorts about 20,000 candidates, and ranks them (implementation report, deviation 3).
- **Impact:** Typing a wikilink is a core action in a notes editor. At the 10,000-note size that DI2 targets, every key inside `[[…` misses the frame budget on the reference machine, and costs about 3× more on Linux CI. S5 ("typing during indexing p95 ≤ 16 ms") holds only for prose, and the cost can grow without any gate catching it.
- **Required resolution:** At 10,000 notes, keys typed after `[[` meet the keystroke budget: p95 ≤ 16 ms on the reference machine, and a Linux CI median within the 2× gate (≤ 32 ms), both during indexing and with the index ready. A `bun run bench` entry gates link typing at 10,000 notes, either a second keystroke bench or link keys added to the existing one, so a regression fails the gate. The owning code is P2-G2 (`completion.ts`). The orchestrator routes the remediation.
- **Required proof:** `bun run bench` exits 0 locally, and the new or extended link-typing metric is printed with p95 ≤ 16 ms. The Linux CI bench job on the remediated head is green with that metric recorded. `bun run check` and `bun run test:ci` stay green, and completion ranking tests (V29 and related) still pass.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - The startup and index-ready budgets (V49) run through the real process in a PTY.
  - Prose typing during indexing (V50) runs with the real worker. A severe batch regression aborts the run: confirmed with the pre-fix NoteIndex.
  - openFile and sourceKeystroke (V51) still pass with `parseDoc` active.
  - The obsolete-reference scan (V54) covers all `.ts` files under `src` and `test`.
  - NoteIndex rebuild equality (V10) still holds after the copy-on-write change.
  - The DI1 suites (V48) pass, and the e2e start race is fixed in the shared `ready` helper.
- **Missing:**
  - No bench covers link-completion keys at 10,000 notes (P3-G1-VER1).
  - Unpaced prose keys meet only about 4 of ~20 batch arrivals (`batches: 4` of 200 keys in 5 local runs). The p95 excludes the 10 slowest keys, so moderate per-batch blocking stays below the metric. Only a severe regression aborts the run. The printed `max` (7.2–12.8 ms locally) is reported but not gated. This is a weakness of the design's metric, not a failed expectation. I recommend gating `max`, or a batch-coinciding key latency, when the bench is next touched.
  - The `V54` scan uses cwd-relative `Bun.Glob(...).scan()`, so it passes vacuously if `bun test` runs from outside the repository root. All project scripts run from the root, so this is a minor robustness note.

## Scope Changes

- **`b74f24b` edits P1-G1 code** (`src/core/features/links/note-index.ts`). The indexing bench found batch costs that grew from 14 to 96 ms per batch, and the V50 gate could not pass without the fix. The change keeps the `NoteIndex` shape and the V10 property, so it is justified and verified.
- **`df5aefc` changes the V50 bench input from link text to prose.** It matches V50's stated unique risk ("batches blocking input"), but it removes the only gated coverage of link typing at scale (P3-G1-VER1).
- **`380d5cc` changes the shared e2e helper `test/e2e/pty.ts:ready`** to fix a start race that predates DI2. The DI1 suite files are unchanged.
- The work-folder move rewrote path references in the goal, plan index, plan parts, plan context and earlier reports. These are reference updates only. System design, requirements and discuss context are byte-identical renames.

## Unverified Items

- **Linux CI median stability for the PH1 exit expectation.** The same code produced firstFrame above 200 ms and indexReady above 3,000 ms in three of four Linux runs:

  | Run | Head | firstFrame | indexReady | openFile |
  |---|---|---|---|---|
  | 37150055331 | `380d5cc` | 222.69 | 3467.59 | 76.33 |
  | 37150892248 | `df5aefc` | 214.66 | 3106.21 | 71.07 |
  | 37151048366 | `ce836ae` | 226.45 | 3725.82 | 77.48 |
  | 37151223129 | `fb2c5d0` | 130.40 | 2106.61 | 46.12 |

  Only `fb2c5d0` was below every target. All metrics move together by about 1.7× between runs, which points to runner variance rather than a code change. V49 passes on the PR head, and the reference-machine values are well below target (117.81 / 900.73 ms). Whether one run is enough PH1 exit evidence is a delivery-acceptance decision for the orchestrator. This verification makes no claim about it.
- **Batch-burst stalls of 22–105 ms** (implementation report, deviation 4) did not reproduce. Five local runs showed a worst key of 7.2–12.8 ms. They may appear under CPU load, which was not tested.
- Delivery acceptance, G2/G3 satisfaction, and parent synchronization stay `Pending` until the user merges PR #2 and authorizes the parent sync. They are outside this group's verification.

## Blockers

None
