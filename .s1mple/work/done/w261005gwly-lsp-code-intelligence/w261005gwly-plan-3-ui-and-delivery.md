# W261005GWLY Plan Part 3 — ui-and-delivery

## Status

`Ready`

## Objective

The user sees LSP state in the running app: gutter signs and underlines, the hover/signature/diagnostic float, the server statusline segment, the cursor diagnostic in the command line, code completion rows, and `<C-Space>`. A PTY suite proves keys, painting, and process cleanup in the real binary path, the `lspKeystrokeP95` bench guards typing, and the work is delivered as one PR with green CI.

## Coverage Summary

- **System Design:** `REQ3@R2, REQ6@R2, REQ7@R2, REQ8@R1, REQ13@R1, REQ14@R2, REQ15@R1; DES6, DES7, DES8, DES10, DES11, DES14, DES15, DES17; S5, S10, S11, S12, S13, S28, S31, S32; V6, V12, V17, V38, V42, V43, V46, V47`
- **UI Design:** `None`

## Sources

- Plan index: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-index.md`
- Plan context: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-context.md`
- System design: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-system-design.md`
- UI design: Not applicable — no UI design was authored; the system design covers the UI surfaces with existing tokens and overlays
- System requirements: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-requirements.md`
- UI requirements: Not applicable — none authored

## Dependencies

- Part 1 verified. Consumed outputs: `AppState.lsp` (`shown`, `float`, `attached`, `servers`), `cursorDiagnostic`, `CompletionState.code`, `diagnosticMarks`, `lspBindings` (`<C-Space>` binding).
- Part 2 verified. Consumed outputs: host wired in `main`; `test/fixtures/fake-lsp.ts`; `test/support/lsp.ts` (`fakeServerConfig`, `readServerLog`, `waitForMessage`).
- Every agent reads `.s1mple/S1MPLE.md` and its required references before editing.

## Execution Flow

```text
P3-G1: UI, end-to-end, and delivery
```

## Groups

### P3-G1 — UI, end-to-end, and delivery

#### Goal

LSP state is painted with existing theme patterns, the real app passes a PTY suite with the fake server and leaves no process behind, the bench reports `lspKeystrokeP95` within its gate, and the PR is open with CI green on the final head after the work folder moves to `work/done/`.

#### Coverage Summary

- **System Design:** `REQ3@R2, REQ6@R2, REQ7@R2, REQ8@R1, REQ13@R1, REQ14@R2, REQ15@R1; DES6, DES7, DES8, DES10, DES11, DES14, DES15, DES17; S5, S10, S11, S12, S13, S28, S31, S32; V6, V12, V17, V38, V42, V43, V46, V47`
- **UI Design:** `None`

#### Scope

- Included: text-view provider wiring; diagnostic and float theme tokens; `LspFloatView` in `OverlayHost`; `StatusSegments.lsp`, `lspSegment`, cmdline fallback; code completion rows; `toKey` `<C-Space>`; `test/ui` gutter case; `test/e2e/lsp.test.ts`; `test/bench/lsp-keystroke.bench.ts` and `scripts/bench-gate.ts`; `.s1mple/docs/project.md`; PR, CI, work-folder move, push.
- Excluded: visual treatment beyond existing tokens and glyphs (`s1mple-discuss-ui`); releases or tags; merging or force-pushing.
- Main files: `src/ui/editors/text-view.ts`, `src/ui/theme.ts`, `src/ui/overlays/lsp-float.ts`, `src/ui/overlays/host.ts`, `src/ui/overlays/completion.ts`, `src/ui/views/statusline.ts`, `src/ui/views/cmdline.ts`, `src/core/state/status.ts`, `src/ui/input.ts`, `src/ui/input.test.ts`, `test/ui/lsp.test.ts`, `test/e2e/lsp.test.ts`, `test/bench/lsp-keystroke.bench.ts`, `scripts/bench-gate.ts`, `.s1mple/docs/project.md`
- Rules: read `.s1mple/S1MPLE.md` first; no work-process ids in code, test names, or logs; run `bun run check` and `bun run test:ci` before every commit and at group end; every suite stops its processes; every agent kills every process it starts (PTY `so` instances, fake servers, bench runs) and confirms `pgrep -f fake-lsp` is empty before benches and before finishing; a missed bench gate gets quick speedups or a relaxed threshold, never a stall; never merge, force-push, tag, or release.

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ6@R2 → DES7 → S10 → V47` | `None` | Window path paints sign `E` in the gutter sign cell |
| `REQ13@R1 → DES14 → S28 → V38` | `None` | ctrl+space → `<C-Space>`; space → `" "` |
| `REQ3@R2 → DES15 → S5 → V6` | `None` | Statusline shows `◌ fake` then `◆ fake` |
| `REQ6@R2, REQ7@R2 → DES7, DES9, DES14 → S10, S11, S13 → V12, V17` | `None` | Gutter `E`, `]d` moves, `:Diagnostics` lists and opens unopened files |
| `REQ15@R1 → DES17 → S32 → V43` | `None` | No fake server remains after quitting |
| `REQ14@R2 → DES6, DES17 → S31 → V42` | `None` | `lspKeystrokeP95` within 2 × 16 ms |
| `REQ6@R2, REQ13@R1 → DES7, DES8, DES11, DES15 → S12, S28` | `None` | Float, cursor diagnostic, and completion rows painted from state |
| `.s1mple/S1MPLE.md` Delivery | `None` | PR open, CI green, work folder in `work/done/`, CI green again |

#### Cross-Work Gates

None

#### Tasks

##### P3-G1-T1 — Diagnostic gutter and theme tokens

- **Outcome:** Windows paint shown diagnostics as gutter signs and underlines through `diagnosticMarks`, with the new theme tokens.
- **System Design:** `REQ6@R2; DES7; S10; V47`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 UI entry (`text-view.ts` window providers, `theme.ts` tokens)
- **Files:** `src/ui/editors/text-view.ts` (window providers, `NO_DIAGNOSTICS`), `src/ui/theme.ts` (`diagnosticError`, `diagnosticWarn`, `diagnosticInfo`, `diagnosticHint`, `float`, `floatActive`), `test/ui/lsp.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V47`:** `test/ui/lsp.test.ts` with `mountShell`

   **Preview:**

   ```ts
   test("a window paints an error sign in the gutter for a shown diagnostic", async () => {
     // mountShell with foo.rs open; dispatch lspDiagnostics for foo.rs line 2 severity 1; leave insert if needed
     // gutter sign cell on line 2's row equals "E"
   });
   ```

   - Run `bun test test/ui/lsp.test.ts` and confirm failure.

2. **GREEN:** `text-view.ts`, `theme.ts`

   **Preview:**

   ```ts
   const NO_DIAGNOSTICS: readonly Diagnostic[] = [];
   const providers = [
     highlightMarks(ft?.highlighter),
     ...(spec?.decorations ?? []),
     diagnosticMarks(s.lsp.shown[b.path] ?? NO_DIAGNOSTICS),
     searchMarks(s.vim.search),
     selectionMarks(selection),
   ];
   ```

   - Embed providers (`text-view.ts:218-224`) stay unchanged.
   - If `test/ui/theme.golden.test.ts` enumerates tokens, update its snapshot deliberately and review the diff.

3. **REFACTOR:** None beyond naming.

   **Preview:**

   ```ts
   // allowed: naming; not allowed: new colours outside the existing palette pattern
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): paint diagnostic signs and underlines

   Task: P3-G1-T1 — Diagnostic gutter and theme tokens
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V47` — `bun test test/ui/lsp.test.ts` → pass
- Golden suites — `bun test test/ui` → pass

##### P3-G1-T2 — Info float overlay

- **Outcome:** `LspFloatView` paints `s.lsp.float` next to its window cursor, clamped to the screen, at most 12 rows and 80 columns, above windows and below modal overlays; it takes no keys and is inert to the mouse.
- **System Design:** `REQ6@R2, REQ13@R1; DES8, DES11; S28`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 UI entry (`LspFloatView`, `OverlayHost`), §9 DES8
- **Files:** `src/ui/overlays/lsp-float.ts` (`LspFloatView`), `src/ui/overlays/host.ts` (`OverlayHost` construction and order), `test/ui/lsp.test.ts`
- **Execution Approach:** `Direct verification — the design defines no case for float painting; open/close behaviour is proven in core (V37, V49), and this task checks painting and mouse inertness in a component test plus the CI suites`

**Steps:**

1. `src/ui/overlays/lsp-float.ts`, `src/ui/overlays/host.ts`, `test/ui/lsp.test.ts`

   **Preview:**

   ```ts
   export class LspFloatView /* same base as other overlays */ {
     // update(s): s.lsp.float → lines wrapped to ≤ 80 cols, ≤ 12 rows, placed below (else above) the window cursor, clamped
     // active parameter range (signature) uses floatActive; body uses float
     // targetAt → { kind: "inert" }; never handles keys
   }
   // host.ts: construct after window views, before picker/prompt/completion overlays
   ```

   - Add a component case in `test/ui/lsp.test.ts`: a hover float's first line appears in the cells below the cursor and a click on it leaves state unchanged.

2. **VERIFY — `S28`:**

   **Preview:**

   ```text
   bun test test/ui/lsp.test.ts && bun run test:ci
   └── Expect: float cells contain the hover line; click changes nothing; all CI suites pass
   ```

   - Run the commands and inspect the results.

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): show hover, signature, and diagnostic floats

   Task: P3-G1-T2 — Info float overlay
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `S28` — `bun test test/ui/lsp.test.ts` → pass

##### P3-G1-T3 — Statusline segment, cursor diagnostic, and completion rows

- **Outcome:** The statusline shows `◌`/`◆`/`✗` per server attached to the active buffer, the command line falls back to the cursor diagnostic in normal mode when no message is set, and code completion rows show `kind label · detail`.
- **System Design:** `REQ3@R2, REQ6@R2, REQ8@R1; DES7, DES10, DES15; S5, S12`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `status.ts`/`statusline.ts`/`cmdline.ts` (`StatusSegments.lsp`, `lspSegment`, cmdline fallback), §7 UI entry (completion rows)
- **Files:** `src/core/state/status.ts` (`StatusSegments.lsp`, `statusSegments`), `src/core/state/status.test.ts`, `src/ui/views/statusline.ts` (`lspSegment`, drop order), `src/ui/views/cmdline.ts` (fallback), `src/ui/overlays/completion.ts` (code rows)
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `S5, S12` (end-to-end proof V6 in P3-G1-T5):** `src/core/state/status.test.ts`

   **Preview:**

   ```ts
   test("the statusline lists servers attached to the active buffer with their state", () => {
     // attached [a@/ws starting with progress "indexing 42%", b@/ws ready] → lsp [{text:"a indexing 42%", state:"starting"}, {text:"b", state:"ready"}]
     // a buffer with no attachments → lsp undefined
   });
   ```

   - Run `bun test src/core/state/status.test.ts` and confirm failure.

2. **GREEN:** `status.ts`, `statusline.ts`, `cmdline.ts`, `completion.ts`

   **Preview:**

   ```ts
   // statusline.ts — design §7
   function lspSegment(l: NonNullable<StatusSegments["lsp"]>[number]): Seg {
     if (l.state === "ready") return { text: `◆ ${l.text}`, token: "statusDim" };
     if (l.state === "failed") return { text: `✗ ${l.text}`, token: "statusError" };
     return { text: `◌ ${l.text}`, token: "statusDim" };
   }
   // cmdline.ts: no message && normal mode → cursorDiagnostic(s) → "<E|W|I|H> <text>" in its severity token
   // completion.ts: mode "code" rows → `${kind} ${label}` · detail
   ```

   - The segment drops first on narrow terminals alongside the preview segment.

3. **REFACTOR:** None beyond naming.

   **Preview:**

   ```ts
   // allowed: naming; not allowed: changing existing segment order or link completion rows
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): show server state, cursor diagnostics, and code completion rows

   Task: P3-G1-T3 — Statusline segment, cursor diagnostic, and completion rows
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `S5, S12` — `bun test src/core/state/status.test.ts` → pass; `bun test test/ui` → pass

##### P3-G1-T4 — `<C-Space>` key

- **Outcome:** ctrl+space normalizes to `<C-Space>`, so the generated insert binding reaches `lsp.complete`; plain space is unchanged.
- **System Design:** `REQ13@R1; DES14; S28; V38`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 UI entry (`toKey`)
- **Files:** `src/ui/input.ts` (`toKey`), `src/ui/input.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V38`:** `src/ui/input.test.ts`

   **Preview:**

   ```ts
   test("ctrl+space is its own key and space stays a space", () => {
     // toKey({name: "space", ctrl: true, …}) → "<C-Space>"; legacy NUL form → "<C-Space>"; plain space → " "
   });
   ```

   - Run `bun test src/ui/input.test.ts` and confirm failure.

2. **GREEN:** `src/ui/input.ts`

   **Preview:**

   ```ts
   if (e.ctrl && e.name === "space") return "<C-Space>"; // before the existing space mapping (input.ts:41-48)
   ```

   - Keep every other key mapping unchanged.

3. **REFACTOR:** None.

   **Preview:**

   ```ts
   // allowed: none; not allowed: other key mapping changes
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): recognize ctrl+space

   Task: P3-G1-T4 — `<C-Space>` key
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V38` — `bun test src/ui/input.test.ts` → pass; `bun test test/vim` → pass

##### P3-G1-T5 — End-to-end language server suite

- **Outcome:** In a PTY with a temp XDG config pointing at the fake server, the real app shows the statusline segment, paints the gutter sign, moves with `]d`, lists diagnostics in `:Diagnostics` including an unopened file that `Enter` opens, and leaves no fake server after quitting.
- **System Design:** `REQ3@R2, REQ6@R2, REQ7@R2, REQ15@R1; DES7, DES9, DES14, DES15, DES17; S5, S10, S11, S13, S32; V6, V12, V17, V43`
- **UI Design:** `None`
- **Canonical Shapes:** system design §8 `e2e/lsp.test.ts`
- **Files:** `test/e2e/lsp.test.ts` (uses `test/e2e/pty.ts` `runInPty`, `statusRow`, `ready`; `test/support/lsp.ts`)
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V6, V12, V17, V43`:** `test/e2e/lsp.test.ts`

   **Preview:**

   ```ts
   test("the statusline shows the server starting and then ready", async () => { /* screen contains "◆ fake" within 5 s */ });
   test("a published diagnostic shows in the gutter, ]d reaches it, and :Diagnostics lists it", async () => {
     // gutter cell "E"; statusline Ln matches the diagnostic line; picker row text
   });
   test("a diagnostic for an unopened file opens from :Diagnostics", async () => { /* Enter → active path is that file */ });
   test("quitting leaves no language server running", async () => { /* pgrep by the unique tag finds nothing */ });
   ```

   - Run `bun test test/e2e/lsp.test.ts`; any failure must be a real wiring gap, not test setup — fix the gap in the owning file, keeping the change within this task.

2. **GREEN:** wiring fixes found by the suite, if any

   **Preview:**

   ```ts
   // only gaps the PTY run exposes (for example a missing registration); no new features
   ```

   - Each fix stays inside an already-planned file and contract.

3. **REFACTOR:** Share PTY setup within the suite only.

   **Preview:**

   ```ts
   // allowed: suite-local helpers; not allowed: changes to test/e2e/pty.ts behaviour used by other suites
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   test(e2e): drive language server features in a terminal

   Task: P3-G1-T5 — End-to-end language server suite
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V6, V12, V17, V43` — `bun test test/e2e/lsp.test.ts` → pass; `pgrep -f fake-lsp` → empty

##### P3-G1-T6 — Keystroke benchmark with a server attached

- **Outcome:** `bun run bench` runs `lspKeystrokeP95` (200 keys in a 5,000-line `.ts` file with the fake server publishing 200 diagnostics per change) and the median stays within twice the 16 ms target.
- **System Design:** `REQ14@R2; DES6, DES17; S31; V42`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `scripts/bench-gate.ts`, §8 `bench/lsp-keystroke.bench.ts`
- **Files:** `test/bench/lsp-keystroke.bench.ts`, `scripts/bench-gate.ts` (`TARGETS.lspKeystrokeP95: 16`, `BENCHES` entry)
- **Execution Approach:** `Direct verification — a benchmark measures a threshold rather than a behaviour; the gate script is the check`

**Steps:**

1. `test/bench/lsp-keystroke.bench.ts`, `scripts/bench-gate.ts`

   **Preview:**

   ```ts
   // bench-gate.ts
   lspKeystrokeP95: 16,                                   // TARGETS
   lspKeystrokeP95: "test/bench/lsp-keystroke.bench.ts",  // BENCHES
   // lsp-keystroke.bench.ts — shape of source-keystroke.bench.ts plus a mounted shell, store, host, and fake server;
   // prints {"metric":"lspKeystrokeP95","ms":p95}; stops the host and the fake server before exiting
   ```

   - Confirm `pgrep -f fake-lsp` is empty before running benches.

2. **VERIFY — `V42`:**

   **Preview:**

   ```text
   bun run bench
   └── Expect: lspKeystrokeP95 median ≤ 32 ms; existing targets unchanged; no fake-lsp process afterwards
   ```

   - If the gate misses, apply quick speedups on the keystroke path (identity checks in `observe`, post-step early returns); if still missing, relax the threshold with the measured value recorded in the commit body, and continue.

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   test(bench): measure typing with a language server attached

   Task: P3-G1-T6 — Keystroke benchmark with a server attached
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V42` — `bun run bench` → `lspKeystrokeP95` within gate

##### P3-G1-T7 — Delivery

- **Outcome:** `project.md` describes the new LSP contracts, a PR to `main` is open with all CI jobs green, the work folder is in `work/done/` with `.s1mple/` references updated, and CI is green on that new head.
- **System Design:** `REQ15@R1; DES17; S32; V46`
- **UI Design:** `None`
- **Canonical Shapes:** `.s1mple/S1MPLE.md` §3 Delivery; plan context §3 Binding Constraints
- **Files:** `.s1mple/docs/project.md` (Purpose and Scope, Technology Stack pins, Boundaries `PACKAGE_HOMES`, Data and Contracts rows for `[lsp]`, `LspState`, LSP host and client, Benchmarks `lspKeystrokeP95`), `.s1mple/work/done/w261005gwly-lsp-code-intelligence/` → `.s1mple/work/done/w261005gwly-lsp-code-intelligence/`
- **Execution Approach:** `Direct verification — delivery steps are checked by CI and repository state, not tests`

**Steps:**

1. `.s1mple/docs/project.md`, PR, work-folder move

   **Preview:**

   ```text
   bun run check && bun run test:ci && pgrep -f fake-lsp   → green, no processes
   update project.md (Last Modified 2026-10-05 or the delivery date) → commit
   git push -u origin feat/w261005gwly-lsp-code-intelligence
   gh pr create --base main --title "feat: LSP code intelligence (W261005GWLY)" --body <summary + test evidence>
   gh pr checks --watch   → every job green; resolve conflicts with main by merging main into the branch (no rebase, no force-push)
   git mv .s1mple/work/done/w261005gwly-lsp-code-intelligence .s1mple/work/done/
   update .s1mple/ references to the moved folder → commit → git push
   gh pr checks --watch   → every job green on the new head
   ```

   - Do not merge, force-push, tag, or release; stop at a green PR and report its URL.

2. **VERIFY — `V46`:**

   **Preview:**

   ```text
   gh pr checks <pr> ; git log -1 ; ls .s1mple/work/done/w261005gwly-lsp-code-intelligence
   └── Expect: check, test (ubuntu-24.04, macos-15), and bench jobs pass on the final head; folder present in work/done; no stale active-path references
   ```

   - Run `rg "work/done/w261005gwly" .s1mple` and confirm no matches.

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   docs: deliver W261005GWLY lsp-code-intelligence

   Task: P3-G1-T7 — Delivery
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V46` — CI on the final PR head → all jobs green

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Pass with zero knip findings |
| CI suites | `bun run test:ci` | Component, integration, and e2e pass without language servers |
| Bench | `bun run bench` | `lspKeystrokeP95` within gate; existing targets unchanged |
| Process hygiene | `pgrep -f fake-lsp` | No processes |
| Work-process ids | `rg "W261005GWLY\|REQ[0-9]\|DES[0-9]" src test scripts` | No matches |
| Delivery | `gh pr checks <pr>` on the final head | All jobs green |

#### Review and Verification Focus

- **Specification:** glyphs and drop order match `indexSegment`, float placement and size bounds, cmdline fallback only in normal mode without a message, completion row format, PTY behaviour for V6/V12/V17/V43, bench target, delivery steps in order.
- **Technical:** UI reads state only, the float never captures keys and is mouse-inert, no allocation for buffers without diagnostics, golden snapshot changes reviewed, no orphan processes after e2e and bench, no merge or force-push.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ6@R2 → DES7 → S10 → V47` | `None` | `P3-G1` | `P3-G1-T1` |
| `REQ6@R2, REQ13@R1 → DES8, DES11 → S28` (painting) | `None` | `P3-G1` | `P3-G1-T2` |
| `REQ3@R2, REQ6@R2, REQ8@R1 → DES7, DES10, DES15 → S5, S12` (painting) | `None` | `P3-G1` | `P3-G1-T3` |
| `REQ13@R1 → DES14 → S28 → V38` | `None` | `P3-G1` | `P3-G1-T4` |
| `REQ3@R2 → DES15 → S5 → V6` | `None` | `P3-G1` | `P3-G1-T5` |
| `REQ6@R2, REQ7@R2 → DES7, DES9, DES14 → S10, S11, S13 → V12, V17` | `None` | `P3-G1` | `P3-G1-T5` |
| `REQ15@R1 → DES17 → S32 → V43` | `None` | `P3-G1` | `P3-G1-T5` |
| `REQ14@R2 → DES6, DES17 → S31 → V42` | `None` | `P3-G1` | `P3-G1-T6` |
| `REQ15@R1 → DES17 → S32 → V46` (CI) and `.s1mple/S1MPLE.md` Delivery | `None` | `P3-G1` | `P3-G1-T7` |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary; later gates are handed off explicitly.
- Every source obligation is covered.

## Planning Gaps

None
