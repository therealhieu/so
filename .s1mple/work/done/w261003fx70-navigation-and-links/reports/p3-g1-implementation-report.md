# P3-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-goal.md`
- **Plan Part:** `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-plan-3-benches-and-delivery.md`
- **Group:** `P3-G1`
- **Tasks:** `P3-G1-T1`, `P3-G1-T2`, `P3-G1-T3`, `P3-G1-T4`, `P3-G1-T5`
- **Report:** `.s1mple/work/done/w261003fx70-navigation-and-links/reports/p3-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

Every task is implemented and committed. PR #2 is green on the final head, and the work folder is in `work/done/`. Three open items are reported below, not hidden:

- The Linux CI medians for `openFile`, `firstFrame` and `indexReady` pass the 2× gate but sit above the targets themselves, so the PH1 exit evidence is not met.
- Link completion costs 16–24 ms per key at 10,000 notes.
- Batch arrivals still cause rare stalls of 22–105 ms.

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P3-G1-T1` | `test/fixtures/generate.ts:makeNoteWorkspace, notePath`; `scripts/bench-gate.ts:TARGETS, BENCHES, runOnce`; `test/bench/startup.bench.ts`; `test/bench/indexing-keystroke.bench.ts`; `src/core/features/links/note-index.ts:addPath, removePath, editLists, sortedIndex` (bench-found fix) | `bun run bench` local exit 0. Medians (ms): sourceKeystrokeP95 3.82, openFile 23.15, firstFrame 116.70, indexReady 911.58, indexingKeystrokeP95 13.56 (link-typing keys; 1.5–7.3 with prose keys after `df5aefc`). `bun run check` exit 0. `bun test src/core/features/links src/core/state` 159 pass (V10 rebuild equality holds) | `b74f24b`, `c7a8663`, follow-up `df5aefc` | `Completed` |
| `P3-G1-T2` | `test/repo.test.ts:OBSOLETE`, test "no obsolete references remain"; `src/app/main.ts` reviewed, no change | `bun test test/repo.test.ts` 5 pass on the clean tree. Planted `export const TABSTOP = 8;` in `src/core/obsolete-probe.ts` → 1 fail (`src/core/obsolete-probe.ts: TABSTOP`). Planted `"ft.analyze("` in `src/ui/obsolete-probe.ts` → 1 fail. Both removed. `tsc` exit 0; `bun run build` compiled main + worker | `a840918` | `Completed` |
| `P3-G1-T3` | `.s1mple/docs/project.md`: pins and homes, component map, startup/index flow, contracts, XDG file table, build script, worker entrypoint, bench targets, sources | Manual cross-check of each fact against `package.json`, `knip.json`, `release.yml`, `config-file.ts`, `state-file.ts`, `log.ts`, `schema.ts`, `config.ts:onConfigLoaded`, `boundaries.test.ts:PACKAGE_HOMES`, `repo.test.ts`, `bench-gate.ts`, and the symbol files (`parseDoc`, `resolveLink`, `planRename`, `parseConfig`, `PersistedState`, `snapshotSession`, `parsePersisted`) → all match | `25dee67` | `Completed` |
| `P3-G1-T4` | None (verification only) | Local results: `bun install --frozen-lockfile` exit 0; `bun run check` exit 0, 3.38 s real, 621 pass; `bun run test:ci` exit 0, 115 pass; `bun run build` exit 0; `bun run bench` exit 0; `knip` exit 0 (zero findings); `tsc` exit 0. DI1 suites: 43 pass. `git diff main` on them: only `test/e2e/quit.test.ts` (+1 session test, P2-G2 `d54b648`) and `test/ui/file-ops.test.ts` (V45 cases, `31b12b6`) changed, both purely additive | No change — verification only; evidence recorded here | `Completed` |
| `P3-G1-T5` | PR #2; `test/e2e/pty.ts:ready, statusRow, startFile` (CI fix); work folder moved to `.s1mple/work/done/w261003fx70-navigation-and-links`, with 18 `.s1mple` references updated | PR CI green on `ce836ae`: `check`, `test (ubuntu-24.04)` (test:ci + bench), `test (macos-15)`. `rg -n "work/active/w261003fx70-navigation-and-links" .s1mple` → no match | `380d5cc`, `ce836ae` | `Completed` |

### Group Change Range

- **Starting commit:** `d70beaf` (clean tree, no staged or unstaged changes)
- **Final commit:** `ce836ae`
- **Remaining group changes:** None

### Group Verification

- `bun run check` → `Passed`: exit 0 in 3.38 s; 621 tests, including V54.
- `bun run test:ci` → `Passed`: 115 pass, 0 fail locally; green on `ubuntu-24.04` and `macos-15` in CI run 37151048366.
- `bun run build` → `Passed`: bundles 325 modules and compiles `dist/so` with main and worker.
- `bun run bench` local → `Passed`, exit 0, all medians below the targets themselves. Values are listed in the T1 row.
- `bun run bench` Linux CI on `ce836ae` → `Passed` (gate). Medians in ms:

  | Metric | Median | Target | Below target? |
  |---|---|---|---|
  | `sourceKeystrokeP95` | 11.07 | 16 | Yes |
  | `openFile` | 77.48 | 50 | No |
  | `firstFrame` | 226.45 | 200 | No |
  | `indexReady` | 3725.82 | 3000 | No |
  | `indexingKeystrokeP95` | 12.77 | 16 | Yes |

  The earlier green run 37150892248 on `df5aefc` gave 12.87, 71.07, 214.66, 3106.21 and 8.50.
- `bun install --frozen-lockfile` → `Passed`.
- `gh pr checks 2` on `ce836ae` → `Passed`: `check` pass (15 s), `test (macos-15)` pass (32 s), `test (ubuntu-24.04)` pass (1m22s).
- V48 DI1 suites (`bun test test/integration/{save-safety,open-save,explorer-ops}.test.ts test/e2e/{restore,quit}.test.ts test/ui/file-ops.test.ts`) → `Passed`, 43 pass. They are also green in CI on both runners.
- G2/G3 V cases → `Passed`:
  - `bun test` on the resolve, note-index, rename, mentions, keys and picker unit files → 47 pass (V8–V16, V22, V29).
  - `bun test` on `test/integration/{rename,config}` and `test/ui/{discovery,links,shell.golden,file-ops}` → 60 pass (V38, V39, V42–V45).

**Delivery**

- **PR:** https://github.com/therealhieu/so/pull/2 (base `main`, not merged)
- **CI runs:**

  | Run | Head | Result |
  |---|---|---|
  | [37149647188](https://github.com/therealhieu/so/actions/runs/37149647188) | `25dee67` | Linux e2e flake, twice |
  | [37150055331](https://github.com/therealhieu/so/actions/runs/37150055331) | `380d5cc` | Linux bench, `indexingKeystrokeP95` 43.73 ms |
  | [37150892248](https://github.com/therealhieu/so/actions/runs/37150892248) | `df5aefc` | Green |
  | [37151048366](https://github.com/therealhieu/so/actions/runs/37151048366) | `ce836ae` | Green; final implementation head |

- **Main baseline before the PR:** `git log 2f907fa..HEAD -- .s1mple/work/active/rm261003abzp-so-v1/` was empty, and `origin/main` = `c98aa19` is an ancestor of HEAD. No merge was needed. No force-push, amend or rebase.

**Cross-work gates (outputs on the PR head; both `Pending`)**

| Gate | Outputs (path:symbol) | V results on this head | Status |
|---|---|---|---|
| G2 (DI2 → DI3) | `src/core/lang/markdown/doc.ts:parseDoc` (block cache through `prev`); `src/core/lang/markdown/syntax.ts:syntaxExtensions`; `src/core/lang/markdown/file-type.ts:markdownFileType` (`analyze: parseDoc`); Markdown key scope through `filetypes: ["markdown"]` bindings in `src/core/state/link-commands.ts:linkBindings`; `src/core/features/links/note-index.ts:NoteIndex`; `src/core/features/links/resolve.ts:resolveLink`; `src/core/state/status.ts:statusSegments, StatusSegments` with `src/ui/views/statusline.ts:Statusline`; `src/core/state/picker.ts:pickerSources`, `src/ui/overlays/picker.ts:PickerView` | V8–V15, V22, V38, V42–V44, V48 pass | `Pending` until the user merges with RM261003ABZP-V4@R2, V5@R1, V6@R2, V18@R1 passing and the PH1 exit evidence recorded. The PH1 exit medians are not yet below their targets (see above) |
| G3 (DI2 → DI4) | `PickerView` preview (`src/core/state/picker.ts:PREVIEW_MIN_COLS`); `src/ui/overlays/prompt.ts:PromptView`; `src/core/features/links/summarize.ts:NoteSummary` (`path`, `frontmatter`); `src/core/filetypes/registry.ts:FileTypeRegistry`; `src/ui/editors/registry.ts:editorViews`; `src/core/state/types.ts:Effect` kinds `search`, `write`, `applyEdits` | V29, V38, V39, V42, V45 pass | `Pending` until merge |

**Pending parent synchronization** (not performed; no authorization):

- System design section 1 rows 1–9:
  1. Assign DI2 to W261003FX70 and set the stage.
  2. `toml-eslint-parser` in DES14.
  3. Summaries come from the scan level; mdast is lazy.
  4. The `planRename` signature and the additive actions and effects.
  5. Every compile lists the worker.
  6. The `editor.*` config.
  7. The `fuzzy.ts` location.
  8. Optional worker message fields.
  9. The `file.save` id.
- The DI2 PR/stage rows: `rm261003abzp-roadmap-index.md:132`, `:143`; phase 1 `:627`. Record PR #2, not merged.
- Deviations D1–D4 from the goal.

No parent file referenced the moved work folder, and none was edited.

### Deviations and Remaining Issues

1. **NoteIndex batch cost fixed outside this group's files (`b74f24b`, owning group P1-G1).** The indexing bench showed each 500-summary batch cost 14 → 96 ms on the main thread as the index grew, about 1.1 s per 10,000-note scan, with keys blocked for up to 1 s. The cause was `addPath`/`removePath` copying and re-sorting lists of up to ~1,900 paths per insert. They now binary-search and copy each shared list once per patch (`Lists`, `editLists`, `writable`).
   - Batch cost is now a flat 5–7 ms, and local `indexReady` dropped from ~1.47 s to ~0.91 s.
   - V10 rebuild equality and every links and state test pass.
   - Remediators must preserve this: a list is mutated only while its patch owns it (`own` set); the arrays in a returned `NoteIndex` are never mutated afterwards.
2. **Indexing keystroke bench types prose (`df5aefc`).** The first version typed `[[note-00042]] #idea`. Its slow keys came from link completion, not batches, and failed the Linux gate (43.73 ms, run 37150055331). V50's stated risk is batches blocking input, so the bench now types prose. It also prints `max` and the number of `batches` applied while typing, so that cost stays visible.
3. **Open finding for P2-G2 (completion at scale), not fixed here.** At 10,000 notes with the index ready, each key typed after `[[` costs 16–24 ms locally (above the 16 ms keystroke budget), and about 3× that on CI.
   - Per key, `src/core/state/completion.ts:noteItems` calls `linkText` for every note (8.4 ms), builds and sorts ~20k candidates, and ranks them with `rankBy` (4.3 ms).
   - A likely fix is to cache the sorted candidates per `(NoteIndex, from)` so only ranking runs per key. Routed to the owning group's remediation per plan T4 ("fix nothing silently").
4. **Open finding for P2-G1 (batch bursts).** With prose keys, 200 unpaced keys see only 1–2 batch arrivals. The worker posts batches in bursts, so the worst key reaches 22–105 ms locally. p95 (V50) passes; the stall is reported for remediation.
5. **PH1 exit evidence not met.** Linux CI medians are above three targets: `openFile` 77.48 (target 50), `firstFrame` 226.45 (200) and `indexReady` 3725.82 (3000). All pass the 2× gate, and locally all are well below target. Delivery acceptance must not treat RM261003ABZP-V13@R1 as satisfied.
6. **E2E start race fixed in the shared helper (`380d5cc`).** `so <file>` paints before the file is read, so `quit`/`restore` cases that typed right after `ready` sometimes sent keys to the explorer. On Linux CI this failed twice, in different tests (run 37149647188).
   - The race predates DI2: under CPU load the uncaught-exception case failed 2 of 20 runs on `main` (`c98aa19`), and 1 of 15 on this branch.
   - `ready` in `test/e2e/pty.ts` now also waits until the statusline shows the start file. The DI1 suite files are unchanged.
   - After the fix the race reproduced 0 of 25 times, and restore + quit passed 10 of 10, all under load.
7. **`main.ts` order (T2).** The order matches the construction flow, so it is unchanged. `createLogger` runs before `registries()`; registries are pure, so the order has no observable effect.
8. **V54 scope.** The check scans every `.ts` file under `src` and `test`, including fixtures, except `test/repo.test.ts`, which holds the patterns.
9. **Bench workspace.** `startup.bench.ts` sets `XDG_CONFIG_HOME` to an empty temp folder, so a developer's `config.toml` cannot change the measurement. Notes are ~950 bytes, 100 per folder, two folders deep.

## Remediation

Append remediation evidence here after verifier findings. This is not a separate report. Preserve the Initial Implementation section unchanged.

- **Verification reports:** `Pending verification`
- **Status:** `Pending verification`

### Finding Closure

None yet.

## Final Status

`Completed` (initial implementation; pending group verification)

### Final Evidence

- **Final report status:** `Completed` — all tasks committed; PR #2 green on `ce836ae`; open findings 3–5 reported for routing
- **Final report commit:** `Pending — returned to the orchestrator`
- **Final commits:** `b74f24b`, `c7a8663`, `a840918`, `25dee67`, `380d5cc`, `df5aefc`, `ce836ae`
- **Final checks:** `bun run check` exit 0 (3.38 s); `bun run test:ci` 115 pass; `bun run build` exit 0; `bun run bench` exit 0 locally and in Linux CI; `bun install --frozen-lockfile` exit 0; `gh pr checks 2` all pass on `ce836ae`
- **Remaining issues:** Deviations 3 (completion cost, P2-G2), 4 (batch bursts, P2-G1), 5 (PH1 exit medians above targets on Linux CI)
