# W261003S6BQ Implementation Plan Index

## Status

`Ready`

## Sources

- Plan context: `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-context.md`
- System design: `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-system-design.md`
- UI design: Not applicable — this W has no UI design; parent UI obligations (RM261003ABZP-UDES10@R2, RM261003ABZP-UV9@R2, and the other assigned UREQ/UDES/US/UV) are carried through the system design's Assigned Parent Obligation Coverage
- System requirements: `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-requirements.md`
- UI requirements: Not applicable — no W UI requirements artifact; parent UREQs are bound through the discussion context
- Research: Not needed — the design records `Research Source: None`
- Discussion context: `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-discuss-context.md`
- UI context: Not applicable — no W UI context artifact; current UI code evidence is in the discussion context sections 2–5

## Roadmap Contract

- **Accepted binding:** `w261003s6bq-discuss-context.md`, Roadmap Binding (RM261003ABZP-PH2@R4 / RM261003ABZP-DI3@R3)
- **Assigned parent coverage:** `w261003s6bq-system-design.md` §1 Assigned Parent Obligation Coverage
- **Finalization assessment:** Aligned — re-checked on 2026-10-04 at `HEAD` `ee33163` (last parent commit touching `rm261003abzp-so-v1/`): phase file header `RM261003ABZP-PH2@R4` (`:3`); DI3@R3 definition (`:322-403`); G2 (`:69`) and G4 (`:71`) rows unchanged; index Delivery Items `:133` assigns DI3@R3 → W261003S6BQ and Work Progress `:144` shows stage Discuss, Aligned, next Plan; no other W binds DI3 (`.s1mple/work/done/` holds only W261003HEGE and W261003FX70). Every assigned parent obligation in design §1 Assigned Parent Obligation Coverage maps to a part, group, and task (Coverage below). G2 is satisfied (`9adb285` ancestor of `HEAD`) and re-confirmed in P1-G1-T1 step 0; G4 is a future gate with owner RM261003ABZP-DI4@R2 and evidence requirements (V4, V38, V41 on the PR head; merge) placed in P1-G1-T3, P1-G2-T2, P1-G2-T4, P3-G1-T1, and P3-G1-T4. No unresolved impact.
- **Cross-work gates:** plan context §2 Cross-Work Dependency Gates — G2 (satisfied; precondition at P1-G1-T1 step 0) and G4 (produced by this work; outputs land in P1-G1-T3, P1-G2-T2, and P1-G2-T4, proven in P3-G1-T1 by V38 and V41 with V4 and V5 from P1-G1, evidence carried in the P3-G1-T4 PR; due before DI4 execution, not before this plan)
- **Parent synchronization:** Pending parent synchronization — no parent write is authorized at the plan stage. Exact pending update: `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md:144` (DI3 Work Progress row) stage `Discuss` → `Plan` (then `Execute` when execution starts), health `Aligned`, next gate `Execute`. Evidence: this index is `Ready`, the goal `w261003s6bq-goal.md` is `Ready`, and reconciliation found the baseline aligned at `ee33163`. Delivery-stage updates (index `:133` PR column, phase Progress row) remain with the goal's Delivery stage.

The reconciler records the finalization assessment; the main orchestrator owns the synchronization receipt. Do not duplicate parent definitions or treat an unsatisfied future gate as a planning blocker.

## Plan Overview

Build the terminal experience first, then the browser mirror, then prove extension, performance, and the compiled binary before delivery. Part 1 grows from the pure core outward: the `livePreview` provider, renderers, views, and configuration in `src/core` (G1), then state consumers and `EditorView` painting (G2), then terminal images after the V43 graphics spike (G3). Part 2 adds the browser preview on the same `Doc`: `renderHtml`, the server, embedded assets, preview state, host, effects, lifecycle, and the statusline segment. Part 3 adds the registration-only extension proof, the bench targets, and the non-test checks, then delivers.

Plan behavior in `.s1mple/S1MPLE.md` is not established, so the s1mple-plan templates govern. Every task carries the **Implementation** rule (lean code; no work-process identifiers in comments, identifiers, test names, or logs — tests are named by behavior). **Verification** is not established, so each group's evidence is the design's V cases plus `bun run check`, with `bun run test:ci` for component, integration, and e2e suites. **Delivery** closes Part 3: open a PR, make CI pass and resolve conflicts with `main`, move the work folder to `work/done/` and update `.s1mple/` references, push again with CI green on the new head; never force-push or merge without the user's approval; no release or tag. Every delegated agent reads and follows `.s1mple/S1MPLE.md` and its required context.

## Execution Flow

```text
Plan 1: terminal live preview → Plan 2: browser preview → Plan 3: extension, performance, and delivery
```

## Plan Parts

| Part | File | Scope | Dependencies | System design | UI design | Verification focus |
|---|---|---|---|---|---|---|
| 1 | `w261003s6bq-plan-1-terminal-live-preview.md` | Core provider, renderers, views, config, view-context registry; embeds, folds, Markdown commands, read-only view; `EditorView` signs, widgets, cursor fit; terminal images | None | `REQ1–REQ6 → DES1–DES8, DES13 → S1–S9, S14, S16, S18 → V1, V1r, V2, V4–V19, V25, V37, V39, V40, V43, V47 (boundary part), V49–V51` | Not applicable — parent UV1@R2, UV3@R2, UV10@R1 (DI3 states) via the design's UI obligations row | V4 goldens, V5 failure isolation, V14 viewport-only, V16 painting, V18 tiers, UV10 DI3 states |
| 2 | `w261003s6bq-plan-2-browser-preview.md` | `renderHtml`, preview server, embedded page and KaTeX/Mermaid, preview state/reducers/host/effects/lifecycle, `openUrl`, statusline | 1 | `REQ1, REQ6, REQ7, REQ8 → DES8, DES9–DES12 → S9, S10–S13, S17 → V3, V20–V24, V26–V34, V36, V47 (boundary part), V48` | Not applicable — parent UV1@R2, UV9@R2 (automated part) via the design's UI obligations row | V21 escaping, V26–V28 server safety, V22 follow timing, V34/V48 CSP and assets, V33 exit |
| 3 | `w261003s6bq-plan-3-extension-performance-delivery.md` | `csv`/`grid` registration proof, bench targets and benches, build and manual checks, PR delivery | 1, 2 | `REQ1, REQ3, REQ6, REQ7 → DES1, DES2, DES3, DES6, DES12, DES14 → S13, S15, S16, S18 → V35, V38, V41, V42, V44–V47` | Not applicable — parent UV9@R2 manual checklist via V42 | V38/V41 registration only, V44 2× bench gate, V35 compiled binary, V47 boundaries, CI |

## Group Layout

| Group | Shared context | Split rule |
|---|---|---|
| `P1-G1` | `src/core/lang/markdown/*` (provider, reveal, render keys, inline, render cache, all block renderers incl. math, Mermaid, embed, image), `src/core/state/{view-context,markdown-view,types,update}.ts` (registry, builder, buffer/window fields, `Registries.viewContexts`), `src/core/config/schema.ts`, `src/app/main.ts` registration, `package.json` (`beautiful-mermaid`), `test/boundaries.test.ts`, `test/fixtures/boundary-violation/*`, `test/support/state.ts`, `test/fixtures/tour.md`; checks V1r, V4–V10, V14, V17, V39, V47 (boundary part) | `First group` |
| `P1-G2` | `src/core/lang/markdown/file-type.ts` views, `src/core/state/{buffers,embeds,markdown-commands,update,session,keys,commands,link-commands,picker}.ts` (incl. `defaultView` and the session snapshot filter), `src/ui/editors/text-view.ts`, `src/ui/widgets/{registry,embed,rule}.ts`, `src/ui/theme.ts`, `src/ui/views/bufferline.ts`, `src/app/main.ts` registration, `test/support/{state,ui}.ts`, `test/ui/{live-preview,theme.golden}.test.ts` and reviewed snapshots; checks V1, V2, V11–V13, V16, V25, V37, V49, UV10 DI3 states | `Too large` — P1-G1 already holds ~25 changed files; split at the G4 provider/`PreviewCtx` seam: G2 consumes the verified provider contract from state and UI and shares no renderer internals |
| `P1-G3` | `src/workspace/images.ts`, `src/ui/images.ts`, `src/ui/widgets/image.ts`, `src/ui/shell.ts` (`ShellDeps.loadImage`, `ViewDeps.images`), `src/ui/editors/text-view.ts` (`ViewHost` image size and cell aspect), `src/app/main.ts` loader injection, `test/support/ui.ts`, `test/fixtures/images/*`, `test/ui/live-preview.test.ts`; checks V43 spike, V15, V18, V19, V40, V50, V51 | `Checkpoint` — the V43 graphics spike must confirm OpenTUI image placement and clearing before painter code, and its outcome becomes a V18 assertion |
| `P2-G1` | `src/core/lang/markdown/html.ts`, `src/preview/{server,assets}.ts`, `src/preview/assets.d.ts`, `src/preview/page.{html,js,css}`, `src/core/state/{preview,status,types,init,update,markdown-commands,commands}.ts` (`AppState.preview`, preview actions/effects, `preview.start`/`preview.stop`, `EX_ALIASES`), `src/app/{preview-host,effects,lifecycle,main}.ts`, `src/workspace/system.ts` `openUrl`, `src/ui/views/statusline.ts`, `package.json` (`katex`, `mermaid`), `test/boundaries.test.ts`, `test/support/state.ts`, `test/integration/preview-server.test.ts`, `test/e2e/quit.test.ts`, `test/ui/shell.golden.test.ts`; checks V3, V20–V24, V26–V34, V36, V47 (boundary part), V48 | `Different context` — the browser preview shares no contracts or checks with terminal painting; it consumes only `Doc`, `blockNode`, and the store, and touches the shared wiring files (`types.ts`, `update.ts`, `main.ts`, test support) only to add its own entries |
| `P3-G1` | `test/ui/extension.test.ts`, `scripts/bench-gate.ts`, `test/bench/*`, `test/fixtures/generate.ts`, build, manual, and CI checks, PR delivery; checks V35, V38, V41, V42, V44–V47 | `Ordered phase` — extension proof, benches, and the compiled binary measure the fully integrated system from Parts 1 and 2 |

## Cross-Part Coordination

| Boundary | Producing part | Consuming part | Coordination requirement |
|---|---|---|---|
| `src/core/state/types.ts` (buffer/window fields in P1; `AppState.preview`, preview actions and effects in P2) | 1 | 2 | P2 adds only the preview state, actions, and effects; names stay distinct from the picker's `readPreview` |
| `src/app/main.ts` `registries()` and composition; `test/support/state.ts` `testRegistries` / `test/support/ui.ts` `mountShell` | 1 | 2, 3 | Each group adds its registrations to both production and test wiring so they stay in parity (design §5 Construction and Wiring Flow) |
| G4 signatures: `PreviewCtx`, `MarkdownViewInput`, `livePreview`, `BlockRenderer`, `registerBlockRenderer`, `registerWidgetPainter`, `WidgetPainter` | 1 | 3 | Signatures equal the phase design (`rm261003abzp-roadmap-phase-2-obsidian-experience.md:205-230`); P3 V5/V38/V41 prove them without edits |
| `src/core/state/status.ts` segments and `src/ui/views/statusline.ts` | 2 | — | P2 owns the full statusline order and drop order (`view`, `words`, `preview`); P1 does not edit them |
| `package.json` / `bun.lock` and `PACKAGE_HOMES` lookup by package name | 1 | 2 | P1 changes `checkImports` to package-name lookup and adds `beautiful-mermaid`; P2 adds exact-pinned `katex` and `mermaid` |
| Bench harness (`mountShell`, fixtures) | 1, 2 | 3 | P3 benches use the final wiring; no production change in P3 except fixes found by verification |

## Coverage

| Source item | Covered by parts | Expected outcome |
|---|---|---|
| `W261003S6BQ-REQ1@R1 → DES1, DES2, DES6, DES8, DES9, DES10, DES11, DES13, DES14` | 1, 2, 3 | Inherited DI3 obligations, G4 outputs, benches, registration-only extension |
| `W261003S6BQ-REQ2@R2 → DES7 → S8 → V17, V18, V19, V40, V50, V51` | 1 | Terminal and web images with tiers, LRU, limits, retry, `images = "off"` |
| `W261003S6BQ-REQ3@R1 → DES3 → S4 → V6, V7, V8, V44` | 1, 3 | Math and Mermaid text renderers, cached per hash; first-frame bench |
| `W261003S6BQ-REQ4@R1 → DES4, DES13 → S5 → V9, V10, V11, V12, V25, V49` | 1 | Embeds via unlisted buffers, capped, one level, evicted |
| `W261003S6BQ-REQ5@R1 → DES5, DES6 → S6, S7 → V13, V14, V15, V16` | 1 | Folds by block id; cursor fit with tall widgets; viewport-only layout |
| `W261003S6BQ-REQ6@R1 → DES1, DES8, DES13 → S1, S9, S16 → V1, V2, V3, V38` | 1, 2, 3 | Views through the registry; notes open in `live`; PH1 sessions restore |
| `W261003S6BQ-REQ7@R3 → DES12 → S13 → V34, V35, V42, V47, V48` | 2, 3 | Page and libraries embedded and same-origin; offline rendering |
| `W261003S6BQ-REQ8@R1 → DES9, DES10, DES11 → S10, S11, S12, S17 → V20–V24, V26–V33` | 2 | HTML, local read-only server, SSE follow, browser launch |
| Parent UV10@R1 DI3 states (plan context §7) | 1 | NO_COLOR, light theme, 80×24 case in `test/ui/theme.golden.test.ts` |
| Roadmap gates G2 (precondition) and G4 (output) | 1, 3 | G2 confirmed at P1-G1-T1 step 0; G4 outputs proven by V4, V5, V38, V41 and reported `Pending` until the user merges the DI3 PR |
| `.s1mple/S1MPLE.md` Implementation and Delivery | 1, 2, 3 | No work-process ids in code; PR, CI, move to `work/done/`, push |

## Overall Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Biome, tsc, knip, boundaries, and unit suites pass (V47) |
| CI suites | `bun run test:ci` | Component, integration, and e2e suites pass |
| Benchmarks | `bun run bench` | All targets within the 2× CI gate (V44); reference readings recorded in the PR (V45) |
| Compiled binary | `bun run build`; run `dist/so` from an empty directory | Page and embedded assets served without `node_modules` (V35) |
| Manual page checklist | Browser at 1200/375 px, light/dark, offline | UV9@R2 checklist recorded in the PR (V42) |
| PR CI | GitHub Actions on the DI3 PR | Green, within the CI timing budget (V46) |

## Completion Criteria

- Every listed plan part is implemented and verified.
- Every system and applicable UI design chain and binding constraint has complete coverage.
- Cross-part coordination is integrated and verified.
- For roadmap-linked work, assigned parent obligations and cross-work checks have actual evidence, and all gates due within this execution scope are satisfied. Report later delivery gates separately; do not infer roadmap delivery from work completion.
- All overall verification checks pass.

## Planning Gaps

None.
