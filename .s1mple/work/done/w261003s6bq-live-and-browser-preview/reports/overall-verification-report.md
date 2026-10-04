# Overall Verification Report

## Scope

- **Goal:** `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-goal.md`
- **Plan Index:** `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-index.md`
- **Plan Parts:**
  1. `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-1-terminal-live-preview.md`
  2. `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-2-browser-preview.md`
  3. `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-3-extension-performance-delivery.md`
- **Report:** `.s1mple/work/done/w261003s6bq-live-and-browser-preview/reports/overall-verification-report.md`

Verified on 2026-10-04 at local `HEAD` `e16d640` on `feat/rm261003abzp-di3-live-preview`. The pushed PR head is `46032b8`; `e16d640` adds only the goal file (`git diff --stat 46032b8 HEAD` → 1 file, `w261003s6bq-goal.md`). `origin/main` has no commits ahead of `HEAD`. The tree was clean at start. Machine: Apple M1 Max, 10 cores, macOS.

## Status

`Failed`

Every group is accepted, every overall check passes, and every `REQ → DES → S → V` chain, cross-part boundary, and assigned parent obligation has actual evidence. The verdict is `Failed` on one Minor documentation finding, OVR-VER1. The P1-G2 embed refinements (`requested` kept until its read answers; the `embed?: true` tag on the `read` effect and on `fileLoaded`/`fileRefused`) are in the code but not in the W system design, which still states the opposite invariant. They are also missing from the PR's pending parent-synchronization list, which REQ1@R1 requires for changed `Action`/`Effect` shapes. No code change is needed.

## Group Acceptance

| Group | Implementation report | Verification report | Closure and commit evidence | Result |
|---|---|---|---|---|
| `P1-G1` | `reports/p1-g1-implementation-report.md` (initial `c85739c`, final `e03ae9e`) | `reports/p1-g1-verification-report.md` (`eeba8fd`, `Failed`: VER1–VER4) | VER1 `91fadb7`, VER2 `4a5e455`, VER3 `37d5774`, VER4 `a358999`; each `Fixed` with regression tests in the Finding Closure table; tasks `8d0cb51`, `2af5239`, `470720b`, `1150aa3`, `b5f906c`, `6e74e72`, `d3c1776`; goal records orchestrator acceptance | `Accepted` |
| `P1-G2` | `reports/p1-g2-implementation-report.md` (initial `c10496f`, final `47bb688`) | `reports/p1-g2-verification-report.md` (`183db2a`, `Failed`: VER1–VER4) | VER1 `7f491e8`, VER2 `a1c9e50`, VER3 `ebf4d95`, `c1edc70`, `324e886`, VER4 report-only in `47bb688`; tasks `4bcea47`, `db27ea5`, `97f84ef`, `195bc95`, `9530f5b`; accepted residual (one extra no-op read after `:bd`) recorded | `Accepted` (design-record gap: OVR-VER1) |
| `P1-G3` | `reports/p1-g3-implementation-report.md` (initial `a0e278e`, final `b111355`) | `reports/p1-g3-verification-report.md` (`2ebd33a`, `Failed`: VER1 Minor) | VER1 `0aec8db`, `9407269`; tasks `119d9c9`, `3bc3959`, `3d9c36a`; T1 no-change spike evidence recorded (byte-level V43) | `Accepted` |
| `P2-G1` | `reports/p2-g1-implementation-report.md` (initial `59892a7`, final `df5fb9b`) | `reports/p2-g1-verification-report.md` (`510e7c6`, `Failed`: VER1 Minor) | VER1 `d128f6f`; tasks `c486398`, `7dabcdc`, `b3258a8`, `c28abe0`, `8d6e7d4` | `Accepted` |
| `P3-G1` | `reports/p3-g1-implementation-report.md` (initial `8521c98`, `f6c98ee`; final `46032b8`) | `reports/p3-g1-verification-report.md` (`06886c7`, `Failed`: VER1–VER4) | VER1/VER2 `e5602b4`, `77ce68c`, `50f9222`, `4603fdb`, `00011bd` (against the user-approved relaxed targets); VER3 design `2495edd` plus PR body; VER4 `8a79835`; tasks `ee55fa9`, `352cf50`, `c58e8eb`, `2348fa4`, `5ca1945`, `a11c8a9`; T4 step 1 PR #6 | `Accepted` |

Every SHA recorded in the goal (71 checked, including `9adb285`, `0c111be`, `ee33163`, `da4739d`, `2495edd`) is an ancestor of `HEAD` (`git merge-base --is-ancestor` → none missing).

## Plan Coverage

| Source item | Planned owner | Implementation evidence | Verification evidence | Result |
|---|---|---|---|---|
| `W261003S6BQ-REQ1@R1 → DES1, DES2, DES6, DES8–DES11, DES13, DES14` | Parts 1–3 | All groups; G4 symbols in `src/core/lang/markdown/live-preview.ts:15-47`, `src/ui/widgets/registry.ts:8-27`, `src/core/state/view-context.ts` | All suites pass (below); G4 signatures equal phase `:205-230`; kernel diff vs `main` empty | `Satisfied` (reporting gap: OVR-VER1) |
| `REQ2@R2 → DES7 → S8 → V17, V18, V19, V40, V50, V51` | P1-G1-T7, P1-G3 | `src/workspace/images.ts`, `src/ui/images.ts`, `src/ui/widgets/image.ts` | `view-context.test.ts`, `src/ui/images.test.ts`, `src/workspace/images.test.ts` in `bun run check`; `test/ui/live-preview.test.ts` in `test:ci`; V43 byte-level spike in the P1-G3 report | `Satisfied` |
| `REQ3@R1 → DES3 → S4 → V6, V7, V8, V44` | P1-G1-T4, P3-G1-T2 | `renderers/math.ts`, `renderers/mermaid.ts` (lazy `beautiful-mermaid`, `77ce68c`) | `math.test.ts`, `mermaid.test.ts` pass; `firstFrame` median 161.19 ms locally, 269.05 ms on PR-head CI (limit 500) | `Satisfied` |
| `REQ4@R1 → DES4, DES13 → S5 → V9, V10, V11, V12, V25, V49` | P1-G1-T5, P1-G2-T2, P1-G2-T4 | `renderers/embed.ts`, `src/core/state/embeds.ts`, `buffers.ts` | `embed.test.ts` 7, `embeds.test.ts` 9 tests pass; V25 in `test/ui/live-preview.test.ts` | `Satisfied` (design text stale: OVR-VER1) |
| `REQ5@R1 → DES5, DES6 → S6, S7 → V13, V14, V15, V16` | P1-G1-T3, P1-G2-T3/T4, P1-G3-T4 | `markdown-commands.ts` `toggleFold`; `src/ui/editors/text-view.ts` cursor fit | `markdown-commands.test.ts`, `live-preview.test.ts` (V14), `test/ui/live-preview.test.ts` (V15, V16) pass | `Satisfied` |
| `REQ6@R1 → DES1, DES8, DES13 → S1, S9, S16 → V1, V2, V3, V38` | P1-G1-T7, P1-G2-T1/T3, P2-G1-T4, P3-G1-T1 | `view-context.ts`, `markdown-view.ts`, `file-type.ts` views, `buffers.ts` `defaultView` | `session.test.ts` (V1), `markdown-commands.test.ts` (V2), `preview.test.ts` (V3), `test/ui/extension.test.ts` (V38) pass | `Satisfied` |
| `REQ7@R3 → DES12 → S13 → V34, V35, V42, V47, V48` | P2-G1-T2/T3, P3-G1-T3 | `src/preview/assets.ts`, `page.{html,js,css}`, `server.ts` `SECURITY_HEADERS`; exact pins `katex` 0.16.47, `mermaid` 12.1.0 | V34/V48 in suites; V35 and V42 re-run by this verifier (Overall Checks) | `Satisfied` |
| `REQ8@R1 → DES9, DES10, DES11 → S10, S11, S12, S17 → V20–V24, V26–V33, V36` | P2-G1 | `html.ts` `renderHtml`, `server.ts`, `preview.ts`, `preview-host.ts`, `system.ts` `openUrl`, `statusline.ts` | `html.test.ts`, `preview.test.ts`, `test/integration/preview-server.test.ts`, `test/e2e/quit.test.ts`, `test/ui/shell.golden.test.ts` pass | `Satisfied` |
| `S15 → V44, V45, V46` | P3-G1-T2, T4 | `scripts/bench-gate.ts:8-18` `TARGETS` equal design §7 (relaxed targets, `2495edd`) | Local bench exit 0; PR-head CI bench green; V46 timings within budget | `Satisfied` |
| `S16, S18 → V38, V41, V47` | P1-G1-T1, P3-G1-T1/T3 | `test/ui/extension.test.ts`; `WindowState.content.editor: EditorKind` (`c58e8eb`), recorded in design `2495edd` | 5 extension tests pass; `bun run check` pass; no Markdown in `src/core/kernel` or `src/ui/editors` | `Satisfied` |
| Parent `UV10@R1` DI3 states | P1-G2-T5 | `test/ui/theme.golden.test.ts` | Passes in `test:ci` (6 tests) | `Satisfied` |
| Parent `UV1@R2`, `UV3@R2`, `UV9@R2` (automated part) | P1-G2, P2-G1 | statusline segments; fold/embed rows; page structure | V36, V16, V25, V34, V48 pass | `Satisfied` |
| Parent `UV9@R2` manual checklist (V42) | P3-G1-T3 | PR #6 body checklist | Re-run by this verifier on the current binary (Overall Checks) | `Satisfied` |
| `.s1mple/S1MPLE.md` Implementation (no work-process ids) | All parts | — | Added lines `git diff 6a04729 HEAD -- src test scripts` grepped for W/RM/REQ/DES/UDES/UV/UREQ/P#-G#/DI/PH/G4/V#/S# ids → no match | `Satisfied` |
| `.s1mple/S1MPLE.md` Delivery step 1 | P3-G1-T4 | PR #6 open, `MERGEABLE`, head `46032b8` | `gh pr checks 6` all pass | `Satisfied` (steps 2–4 not yet due) |

## Roadmap Contract Evidence

- **Accepted baseline actually verified:** RM261003ABZP-PH2@R4 / RM261003ABZP-DI3@R3 with RM261003ABZP-DES13@R3, RM261003ABZP-UDES10@R2, and RM261003ABZP-UV9@R2, bound by `w261003s6bq-discuss-context.md` Roadmap Binding; assigned coverage in `w261003s6bq-system-design.md` §1 Assigned Parent Obligation Coverage.
- **Current-source assessment:** Aligned. `git diff --quiet ee33163 HEAD -- .s1mple/work/active/rm261003abzp-so-v1/` → no change since the planning and execution-start checks. Re-read: phase header `:3` `RM261003ABZP-PH2@R4`; G2 `:69`; G4 `:71`; DI3@R3 heading `:322`; signatures `:205-230`; index `:133` (DI3@R3 → W261003S6BQ, PR `Pending`) and `:144` (stage `Discuss`, administrative lag); `rm261003abzp-design.md:103,148` cite DES13@R3; `rm261003abzp-ui-design.md:84,108` cite UDES10@R2 and UV9@R2. No other W binds DI3 (`work/done/` holds W261003HEGE and W261003FX70 only). One known divergence: the parent RM261003ABZP-REQ9@R2 still states the 16 ms / 50 ms targets for the live view, while the W requirements Constraints and design §7 carry the user-approved relaxed live and startup targets (2026-10-04, `2495edd`). That relaxation is user-approved and pending parent synchronization, so it is administrative, not an unresolved conflict.

| Assigned parent obligation | Child coverage / owner | Actual implementation and verification evidence | Result |
|---|---|---|---|
| Live preview — RM261003ABZP-REQ5@R2; DES6@R2, DES9@R3, DES17@R1; S5@R1 / V7@R2 | REQ1, REQ3–REQ6; DES1–DES6; V1–V16, V49; P1-G1, P1-G2 | `live-preview.test.ts` goldens (V4 = V7@R2) and V5, V14 pass in `bun run check` (739 pass) | `Satisfied` |
| Terminal images — DES10@R2, DES16@R1; V8@R1 | REQ2; DES6, DES7; V17–V19, V40, V50, V51; P1-G3 | V18 (= V8@R1) in `test/ui/live-preview.test.ts` passes in `test:ci` (144 pass) | `Satisfied` |
| Markdown-scoped commands — DES5@R2 | REQ1, REQ6; DES8; V2, V3, V13, V37 | Suites pass | `Satisfied` |
| Browser preview — REQ8@R2; DES13@R3; S8@R1 / V11@R3 | REQ1, REQ7, REQ8; DES9–DES12; V20–V35, V48; P2-G1 | `preview-server.test.ts` (V22–V24, V26–V28, V30, V32, V34) and `quit.test.ts` (V33) pass; V35 re-run byte-equal | `Satisfied` |
| Browser library delivery — DES13@R3, PH2@R4 (no bundling exclusion), DI3@R3 scope, UDES10@R2 / UV9@R2 | REQ7@R3; DES10, DES12; V34, V35, V42, V47, V48 | Binary serves embedded KaTeX/Mermaid byte-equal; V42 re-run: one origin, math and diagrams render with all non-loopback requests aborted | `Satisfied` |
| Configuration — DES14@R2 | REQ1, REQ4; DES13; V39 | `config.test.ts` passes | `Satisfied` |
| Performance — REQ9@R2; DES16@R1; S9@R1 / V12@R2, V13@R1 re-run | REQ1, REQ3, REQ5; DES2, DES6, DES14; V44, V45 | Local bench and PR-head CI bench pass every 2× limit; local medians within every 1× target (approved relaxed targets for live/startup; source targets unchanged) | `Satisfied` (relaxation pending parent sync) |
| Budgets — REQ10@R4; DES15@R4 | REQ1; existing design; V46 | `check` 5.58 s local; PR-head CI wall 1 min 59 s; workflows unchanged | `Satisfied` |
| Foundations and registration-only extension — REQ11@R3; DES1@R2, DES17@R1; S11@R1 / V16@R2 | REQ1, REQ6; DES1, DES2, DES14; V38, V41; P3-G1 | `test/ui/extension.test.ts` 5 pass; kernel unchanged vs `main` | `Satisfied` |
| UI obligations — M2, M7, M1; UREQ1/3/4/6/10/11; UDES1/3/4/10/11; UV1@R2, UV3@R2, UV9@R2, UV10@R1 | DES2, DES6, DES11, DES12; V4, V16, V33, V36, V42, V43 | Goldens, shell golden (V36), theme golden (UV10), V42 checklist re-run | `Satisfied` |
| G4 outputs — phase `:71`, `:205-230` | DES2, DES4, DES6; V5, V9, V41 | Shapes in `live-preview.ts:15-47` equal phase `:213-224`; `WidgetPainter`/`registerWidgetPainter` equal design §6; unlisted embed buffers in `embeds.ts` | `Satisfied` |
| Downstream work boundary — phase `:390-395` | DES2, DES6, DES10; V30, V38, V41, V47 | `git diff --stat 6a04729 HEAD -- src/core/kernel` empty; no Markdown match in `src/core/kernel`, `src/ui/editors`; GET-only routes (V28 405) | `Satisfied` |
| `AppState` additions reported for parent sync (REQ1@R1 criterion 5) | REQ1; design §1 item 6; PR body | `preview` is the only new top-level key; `listed`, `embeds`, `folds`, `editor: EditorKind` recorded; the `embed?: true` tag on `read`/`fileLoaded`/`fileRefused` is not | `Mismatch` (OVR-VER1) |

| Cross-work gate or integration boundary | Producer DI / W | Consumer DI / W | Verification owner | Actual evidence | Result |
|---|---|---|---|---|---|
| G2 — phase `:69`, due before DI3 execution | RM261003ABZP-DI2@R2 / W261003FX70 (`9adb285`, PR #2) | RM261003ABZP-DI3@R3 / W261003S6BQ | Orchestrator (P1-G1-T1 step 0) | `git merge-base --is-ancestor 9adb285 HEAD` → exit 0 (re-checked now); recorded under Gate Evidence at `0c111be` | `Passed` |
| G4 — phase `:71`, due before DI4 execution of the `![[file.base]]` renderer | RM261003ABZP-DI3@R3 / W261003S6BQ | RM261003ABZP-DI4@R2 (W Pending) | RM261003ABZP-DI4@R2 | Outputs present on the PR head; V4/V5 (`live-preview.test.ts`) and V38/V41 (`test/ui/extension.test.ts`) pass locally and in PR-head CI run 37179396485; PR body states `Pending` | `Unverified` — outputs and proof present; the gate stays `Pending` until the user merges PR #6, which is outside this scope |

Parent synchronization (index `:133`, `:144`, phase `:586`, the REQ9@R2 relaxation, and the design refinements) is pending without authorization. That is administrative and does not by itself affect this verdict.

## Cross-Part Integration

| Boundary or handoff | Producing part | Consuming part | Evidence | Result |
|---|---|---|---|---|
| `src/core/state/types.ts`: P1 buffer/window fields; P2 `AppState.preview`, preview actions and effects | `1` | `2` | Diff vs `6a04729`: only `preview` added at top level; `listed`, `embeds`, `content.folds`/`editor` nested; preview action/effect names distinct from `readPreview`; `state.json` stays `version: 1` (`session.ts:38,87`) | `Passed` |
| `registries()` in `src/app/main.ts` and `testRegistries`/`mountShell` parity | `1` | `2`, `3` | Extension, live-preview, and shell suites use the same wiring and pass; the compiled binary renders live view and serves the preview | `Passed` |
| G4 signatures | `1` | `3` | `live-preview.ts:15-47` equals phase `:213-224`; V5, V38, V41 pass without provider edits | `Passed` |
| Statusline segments and drop order | `2` | — | `test/ui/shell.golden.test.ts` (V36) passes | `Passed` |
| `PACKAGE_HOMES` by package name; exact pins | `1` | `2` | `test/boundaries.test.ts:52-54`; `package.json` `katex` 0.16.47, `mermaid` 12.1.0, `beautiful-mermaid` 1.1.3; boundary test in `check` | `Passed` |
| Bench harness on final wiring | `1`, `2` | `3` | `bun run bench` exit 0 locally; PR-head CI bench green | `Passed` |

## Overall Checks

| Check | Command or method | Expected result | Actual result | Result |
|---|---|---|---|---|
| Process hygiene before benchmarks | `ps -axo pid,ppid,etime,command`; `uptime` | No stray load from this session | Killed pid 50753 `bun test/bench/indexing-keystroke.bench.ts` (ppid 1, cwd this repo, 9 h 38 min, 0 % CPU; the orphan the P3-G1 remediator left). Untouched: Ghostty 29823, `http.server` 56398 and 7607, `bun run tui` 43089/43090, Chrome and Playwright MCP servers of other sessions, the `cong` verification run (pids 4691…58701). Load average at start 15.27 / 17.70 / 22.45, almost all from the `cong` run | `Passed` |
| Fast gate (V47) | `bun run check` | Biome, tsc, knip, boundaries, unit pass; < 30 s | Exit 0; Biome 249 files clean; tsc and knip clean; 739 pass, 0 fail, 18 snapshots; 5.58 s wall | `Passed` |
| CI suites | `CI=true bun run test:ci` | Component, integration, e2e pass | 144 pass, 0 fail, 28 snapshots, 22 files, 30.29 s | `Passed` |
| Benchmarks (V44, V45) | `bun run bench` (local, load average 18–20) | Every median ≤ 2× approved target | Exit 0. Medians ms (target): `sourceKeystrokeP95` 7.72 (16), `liveKeystrokeP95` 10.68 (24), `openFile` 57.03 (80), `sourceOpenFile` 20.15 (50), `liveScrollFrameP95` 6.81 (16.7), `sourceScrollFrameP95` 5.73 (16.7), `firstFrame` 161.19 (250), `indexReady` 1216.71 (3000), `indexingKeystrokeP95` 10.86 (30). All within 1× as well as 2×. PR-head Linux CI (run 37179396485): 10.91, 17.69, 98.98, 31.46, 16.10, 8.96, 269.05, 3290.68, 24.42, all within 2×. Reference readings are in the PR body's Performance table | `Passed` |
| Compiled binary (V35) | `bun run build`; copy `dist/so` alone to a `mktemp` dir; run from an empty working directory under `test/e2e/pty.ts` `runInPty`, PATH-stubbed `open`, `:Preview`; fetch routes; `cmp` | 200 with bytes equal to package files; unknown asset 404; no `node_modules` | `dist/so` 84,105,330 B. `cmp` identical: `/` = `src/preview/page.html`; `/assets/katex.min.js` (272,537 B), `/assets/mermaid.min.js` (5,493,176 B), `/assets/fonts/KaTeX_Main-Regular.woff2` (26,272 B, `font/woff2`), `/assets/katex.min.css` = `node_modules/...`; `page.js`, `page.css` = `src/preview/`. `/assets/nope.js` 404. CSP, `nosniff`, `no-referrer` on all 8 responses. Binary dir held only `so` before and after; cwd empty. `dist/` is git-ignored (`.gitignore:6`), so it was left in place | `Passed` |
| Manual page checklist (V42, UV9@R2) | PR #6 body and P3-G1 report; re-run with Playwright MCP on the current binary (`tour.md` plus a note with `$$\frac{1}{$$` and a broken flowchart), every non-`127.0.0.1` request route-aborted | Math and Mermaid render offline; malformed blocks show source with the render-error label; one origin; no CSP violation | 1200 and 375 px × light and dark: 2 KaTeX and 1 Mermaid SVG on `tour.md`; malformed formula and diagram shown as source with class `render-error` and `::before` content `"render error"`; no page-level horizontal scroll (1185≤1185, 360≤360, …); bg/fg `#FBFBFA`/`#1F2328` light, `#16181C`/`#E6E8EB` dark; no form or `contenteditable`; badge `Live`. 76 requests, 1 origin `http://127.0.0.1:62424`, 0 aborted; console empty. Badge transitions (`Stopped`, `Reconnecting…`, `Offline`) not re-run; taken from the recorded P3-G1 run | `Passed` |
| PR CI (V46) | `gh pr checks 6`; `gh run view 37179396485` | Green on the PR head; CI < 3 min | Head `46032b8`: `check` pass (29 s), `test (macos-15)` pass (40 s), `test (ubuntu-24.04)` pass (1 min 55 s), CodeRabbit pass; wall 05:16:14 → 05:18:13 UTC = 1 min 59 s. PR `OPEN`, `MERGEABLE`, not draft | `Passed` |
| Layer rules and boundaries | `test/boundaries.test.ts` in `check`; inspection of `:29-30`, `:52-54` | `src/preview` imports only `src/preview`, `src/core`; package homes by name | Pass | `Passed` |
| No Markdown in kernel or generic editor | `grep -rniE 'markdown|livePreview|mdast' src/core/kernel src/ui/editors`; `git diff --stat 6a04729 HEAD -- src/core/kernel` | No match; kernel unchanged | No match; empty diff | `Passed` |
| No work-process identifiers in code | Added lines of `git diff 6a04729 HEAD -- src test scripts` grepped for W/RM/REQ/DES/UDES/UV/UREQ/P#-G#/DI@/PH@/G4/V#/S#@ | None | None | `Passed` |
| `state.json` version and `AppState` keys | `src/core/state/session.ts:38,87`; top-level fields of `AppState` vs `6a04729` | Version 1; only `preview` added | `version: z.literal(1)`, writes `version: 1`; only `+ preview: PreviewState` at top level | `Passed` |
| Lockfile and pins | `package.json` | Exact pins | `katex` 0.16.47, `mermaid` 12.1.0, `beautiful-mermaid` 1.1.3 (frozen-lockfile already passed in P3-G1 and CI install) | `Passed` |

## Findings

### OVR-VER1 — Minor — The P1-G2 embed refinements are not in the W design or the PR's parent-sync list

- **Owner:** `P1-G2`
- **Source items:** `W261003S6BQ-REQ1@R1` (acceptance criterion 5), `W261003S6BQ-REQ4@R1`, `W261003S6BQ-DES4`, `S5`, `V11`, `V49`
- **Evidence:** The accepted P1-G2 remediation (`7f491e8`) changed two behaviours. First, a note's `requested` keeps a target until its read answers. Second, embed reads carry `embed?: true`, and so do their answers:

  ```ts
  // src/core/state/types.ts:298, :353
  | { type: "fileLoaded"; path: string; file: TextFile; embed?: true }
  | { kind: "read"; path: string; embed?: true }
  ```

  The W system design still states the opposite rule. `w261003s6bq-system-design.md:1182` says "a buffer's `requested` and `refused` hold only targets that buffer currently embeds", and `:1983` shows `const requested = keep(b.embeds?.requested)`. `grep -n 'embed?: true\|until its read answers'` finds nothing in the design, and its only commits since planning are `4308ab6` and `2495edd`, which recorded the P3-G1 editor-kind change but not these. The goal itself lists them as "Design refinements to sync into the W system design (§6 `embeds.requested`, §7 `syncEmbeds` and `onFileLoaded`/`onFileRefused`)". The design's invariant "at most one `read` is outstanding per path across all buffers" (`:1182`) also needs the accepted `:bd` residual exception. PR #6's "Pending parent synchronization" section lists `content.editor` and the REQ9@R2 relaxation, but it does not list the `embed?: true` field added to the PH1 `read` effect and to the `fileLoaded`/`fileRefused` actions. REQ1@R1 criterion 5 requires every `Action` or `Effect` change DI3 makes to be reported.
- **Impact:** The behaviour is correct and tested (`embeds.test.ts`, 9 cases). The risk is in the documents. The authoritative W design, and the parent phase design that DI4 plans against, describe a `requested` rule and a `read` effect shape that the code no longer has. A DI4 change to embeds or to the `read` effect (`![[file.base]]` uses the same unlisted-buffer path, G4) could reintroduce P1-G2-VER1 by following the design.
- **Required resolution:** Update W system design §6 `BufferState.embeds` (invariants) and §7 `src/core/state/embeds.ts`, `buffers.ts`, and `types.ts`. They must say that `requested` holds a target until its read answers, that only `refused` is trimmed to current embeds, that embed reads and their answers carry `embed?: true` and a tagged answer is shown only when a window waits, and that the `:bd` residual allows one extra no-op read. Add the `embed?: true` field on `read`, `fileLoaded`, and `fileRefused` to PR #6's pending parent-synchronization list.
- **Required proof:** `grep -n 'embed?: true' .s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-system-design.md` returns §6/§7 hits. The `:1182` invariant no longer says `requested` holds only currently embedded targets. `gh pr view 6 --json body` lists the `embed?: true` change under "Pending parent synchronization".

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change and commit evidence are recorded.
- [ ] The orchestrator validates closure evidence.

## Unverified Items

- G4 gate satisfaction: the outputs and proof (V4, V5, V38, V41) are present and pass on the PR head. The gate itself remains `Pending` until the user merges PR #6, which is outside this scope.
- V42 badge transitions (`Stopped`, `Reconnecting…` → `Offline`) were not re-run. They rely on the P3-G1 implementer's Playwright run (P3-G1 report §P3-G1-T3, PR body). The rest of the checklist was re-run here on the current binary.
- V43 (terminal graphics clearing) rests on the accepted P1-G3 byte-level evidence. No screenshots exist, because Screen Recording permission is unavailable. It was not re-run here.
- V45 reference readings were taken here under load average 18–20 from another project's verification run. They still meet every 1× target, but they are not idle-machine readings. The idle readings are those in the PR body.
- Observations for later stages, not findings in this scope: `.s1mple/docs/project.md` Benchmarks still lists the old `openFile` 50, `firstFrame` 200, and `indexingKeystrokeP95` 16 targets and only five metrics. This belongs to Project Documentation Finalization. Plan Part 3 (P3-G1-T2) still shows the pre-approval targets, which the design §7 and requirements Constraints supersede.

## Blockers

None.

## Completion Assessment

- **All groups accepted:** `Yes`
- **Plan coverage complete:** `Yes`
- **Cross-part integration passed:** `Yes`
- **Assigned parent coverage and cross-work checks passed:** `No` — the `AppState`/`Action`/`Effect` reporting obligation (REQ1@R1 criterion 5) is incomplete (OVR-VER1); G2 passed; G4 outputs are present and stay `Pending` until merge
- **All overall checks passed:** `Yes`
- **No unresolved finding or blocker remains:** `No` — OVR-VER1 (Minor)
