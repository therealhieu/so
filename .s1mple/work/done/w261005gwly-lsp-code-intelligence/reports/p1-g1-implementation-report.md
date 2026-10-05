# P1-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-goal.md`
- **Plan Part:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-1-core.md`
- **Group:** `P1-G1` — Contracts
- **Tasks:** `P1-G1-T1`, `P1-G1-T2`, `P1-G1-T3`
- **Report:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p1-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P1-G1-T1` | `src/core/config/lsp.ts`: `LSP_FILE_TYPES`, `RootMarker`, `VersionGate`, `ServerSpec`, `BUILTIN_SERVERS` (7 entries, design §7 order and fields), `LspConfigSchema`, `LspConfig`, `resolveServers`, `gateAllows`; private `TS_LOCKS`, `TS_MARKERS`, `TSC_PROBE`, `BUILTIN_NAMES`, `ServerEntry`, `merge`. `src/core/config/schema.ts`: `ConfigSchema.lsp = LspConfigSchema.prefault({})`. `src/core/config/lsp.test.ts` (8 cases). `src/core/config/toml.test.ts`: expected full config gains `lsp` defaults | RED: `bun test src/core/config/lsp.test.ts` → failed, `Cannot find module './lsp'`. GREEN: same command → 8 pass, 0 fail, 27 expects. `bun run check` → biome clean, tsc clean, knip zero findings, 1105 pass / 0 fail | `21af6c94dc43d9951197c7ff298724ddfb2b15f6` | `Completed` |
| `P1-G1-T2` | `src/core/kernel/view/diagnostics.ts`: `DiagnosticSeverity`, `Diagnostic`, `diagnosticMarks`; private `SIGN`, `clamp`, `visibleRange`. `src/core/kernel/view/diagnostics.test.ts` (5 cases) | RED: `bun test src/core/kernel/view/diagnostics.test.ts` → failed, module missing. GREEN: same command → 5 pass, 0 fail, 20 expects. `bun run check` → biome, tsc, knip clean; 1110 pass / 0 fail | `0de3c356c35c7d81a89c15ef83fa200a2c943962` | `Completed` |
| `P1-G1-T3` | `src/core/state/lsp-types.ts`: `ServerKey`, `LspFeature`, `ServerView`, `CodeLocation`, `CodeSymbol`, `CodeTextEdit`, `CodeEdit`, `CodeCompletionItem`, `CodeAction`, `PendingRequest`, `LspFloat`, `CodeEditBatch`, `DiagnosticSlots`, `CodeAccept`, `LspState` (no `LspOp`/`LspResult`). `src/core/state/types.ts`: `AppState.lsp`, `CompletionState` `"code"` mode + `code?` + row `source?`, `RenamePrompt` in `PromptState`, `rename?: never` on `ExplorerPrompt`/`NewNotePrompt`, `TimerId` `completion`/`lspResolve`/`` `lsp:${number}` ``/`` `lspFormat:${BufferId}` ``. `src/core/state/init.ts`: `initialState().lsp`. Compile guards: `src/core/state/explorer.ts:promptKey`, `src/ui/views/explorer.ts:treeField`, `src/ui/overlays/prompt.ts:layout` | Direct verification: `bun run check` → biome clean, tsc clean, knip zero findings (no unused export from `lsp-types.ts`), 1110 pass / 0 fail | `024d68af680bc55bf1e386e94b44707a2d31b830` | `Completed` |

### Group Change Range

- **Starting commit:** `dc4e6316be3bc7e556e02a7bca60c859b9f1230d` (clean tree, no staged or unstaged changes before implementation)
- **Final commit:** `024d68af680bc55bf1e386e94b44707a2d31b830`
- **Remaining group changes:** None

### Group Verification

- `bun run check` → `Passed` — biome clean (330 files), tsc clean, knip zero findings, 1110 pass / 0 fail across 101 files
- `bun test src/core/config src/core/kernel/view` → `Passed` — 57 pass / 0 fail across 7 files
- `rg "W261005GWLY|REQ[0-9]|DES[0-9]|\bV[0-9]+\b|P1-G"` over every file changed since `dc4e631` → `Passed` — no matches
- `pgrep -f fake-lsp` → `Passed` — empty; this group started no processes

### Deviations and Remaining Issues

1. **`severityRank` not added.** The plan lists it under T2's files, but neither the design §7 shape nor any later plan task defines or consumes it, and `DiagnosticSeverity` already orders by number (design §6: "kept because it orders naturally"). Adding it would be an unspecified export with no caller. A later group can compare `severity` directly.
2. **Compile guards for `RenamePrompt` outside the T3 file list.** Adding `RenamePrompt` to `PromptState` broke narrowing on `newNote` at three existing sites (`p.op` became possibly undefined). Following the `never`-discriminator pattern and the `p.rename !== undefined` check that P1-G3-T2's preview uses, `ExplorerPrompt` and `NewNotePrompt` gained `rename?: never`, and:
   - `src/core/state/explorer.ts:promptKey` returns `none(s)` for a rename prompt (unreachable until a rename prompt is opened; P1-G3-T2 replaces this line with the submit path).
   - `src/ui/views/explorer.ts:treeField` excludes rename prompts from in-tree editing.
   - `src/ui/overlays/prompt.ts:layout` draws a rename prompt as title, field, the `invalid` line, and `⏎ rename · esc cancel`. No later plan task names this layout, so a remediator must keep a rename branch here.
3. **`toml.test.ts` updated.** The existing "a valid file parses with binding lines" case compares the whole parsed config, so it now expects `lsp: { enabled: false, formatOnSave: false, servers: {} }`.
4. **Decisions to preserve in `diagnosticMarks`.** A diagnostic is drawn only when its start line is visible; multi-line ranges are clamped to the last visible line, so the provider reads only `v.visible` lines. A zero-width range covers the next character, or the last character at the end of a line. Marks are emitted least severe first so the most severe wins where marks overlap; signs come one per line in line order. Non-integer or out-of-range start lines are skipped, and non-numeric or negative columns clamp to 0.
5. **`resolveServers` details.** An override replaces `settings` whole (no deep merge). rust-analyzer gets `initOptions = settings["rust-analyzer"]` only when `initOptions` is unset and that value is a plain object. An added server with `enabled = false` is dropped like a built-in.

## Remediation

- **Verification reports:** `Pending verification`
- **Status:** `Pending verification`

### Finding Closure

Pending verification.

## Final Status

`Pending verification`

### Final Evidence

- **Final report status:** `Pending verification` — initial implementation completed
- **Final report commit:** `Pending verification`
- **Final commits:** `21af6c94dc43d9951197c7ff298724ddfb2b15f6`, `0de3c356c35c7d81a89c15ef83fa200a2c943962`, `024d68af680bc55bf1e386e94b44707a2d31b830`
- **Final checks:** `bun run check` → Passed; `bun test src/core/config src/core/kernel/view` → Passed
- **Remaining issues:** None
