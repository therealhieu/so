# P1-G1 Verification Report

## Scope

- **Group:** `P1-G1`
- **Tasks:** `P1-G1-T1`, `P1-G1-T2`, `P1-G1-T3`
- **Report:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p1-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p1-g1-implementation-report.md` (status `Completed`; change range `dc4e631..024d68a`, task commits `21af6c9`, `0de3c35`, `024d68a`)

## Status

`Passed`

## Assigned Traceability

- **System Design:** `REQ1@R2 → DES2 → S1 → V1`; `REQ2@R2 → DES2 → S3, S34 → V3, V4`; `REQ2@R2 → DES2 → S33 → V50`; `REQ5@R1 → DES2 → S9 → V11`; `REQ6@R2 → DES7 → S10 → V13, V14`; `REQ4@R1 → DES5 → S7 → V46`
- **UI Design:** `None`

## Specification Verification

Every assigned chain is implemented as the design §7 shapes specify. The parts of `S1`, `S33`, `S34`, and `S7` that need a host or client (no spawn, `localBin` lookup, `workspace/configuration`, op-to-method mapping) belong to later groups; this group owns only their pure contracts, which are present.

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1@R2 → DES2 → S1 → V1` | `None` | No `[lsp]` section parses to `enabled:false`, `formatOnSave:false`, `servers:{}` | `src/core/config/lsp.ts:LspConfigSchema` (defaults `false`/`false`/`{}`); `src/core/config/schema.ts:ConfigSchema.lsp = LspConfigSchema.prefault({})` | `Satisfied` |
| `REQ2@R2 → DES2 → S3, S34 → V3, V4` | `None` | Built-ins in table order, field-wise overrides, disabled removed, additions appended; rust-analyzer `initOptions` from `settings`; incomplete addition is a line error | `src/core/config/lsp.ts:BUILTIN_SERVERS` (7 entries, design §7 order and fields), `merge`, `resolveServers`, `LspConfigSchema.superRefine` (`"a new server needs command and fileTypes"` at `["servers", name]`) | `Satisfied` |
| `REQ2@R2 → DES2 → S33 → V50` | `None` | Exactly one of `tsc`/`typescript` passes `gateAllows` per major, including unknown | `src/core/config/lsp.ts:gateAllows`; gates `{atLeast: 7}` / `{below: 7}` sharing `TSC_PROBE` | `Satisfied` |
| `REQ5@R1 → DES2 → S9 → V11` | `None` | `markdown`, `base`, `text`, typos in `fileTypes` are errors on the key's line | `src/core/config/lsp.ts:LSP_FILE_TYPES` (`CODE_LANGUAGES` minus `markdown`), `ServerEntry.fileTypes: z.array(z.enum(LSP_FILE_TYPES))` | `Satisfied` |
| `REQ6@R2 → DES7 → S10 → V13, V14` | `None` | One highest-severity sign per line, one mark per range, clamped, never throws | `src/core/kernel/view/diagnostics.ts:diagnosticMarks`, `visibleRange`, `clamp`, `SIGN` | `Satisfied` |
| `REQ4@R1 → DES5 → S7 → V46` | `None` | State types compile into `AppState`; `bun run check` passes | `src/core/state/lsp-types.ts` (every §7 type except `LspOp`/`LspResult`, as the plan scopes); `src/core/state/types.ts:AppState.lsp`, `CompletionState` (`"code"`, `code?`, row `source?`), `RenamePrompt`, `TimerId`; `src/core/state/init.ts:initialState().lsp` | `Satisfied` |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V1` | `S1` | `DES2` | `bun test src/core/config/lsp.test.ts` — "language servers are off when the config has no lsp section" | `parseConfig("").lsp` equals `{enabled:false, formatOnSave:false, servers:{}}`; `defaults.lsp` flags are `false` | `Passed` |
| `V3` | `S3`, `S34` | `DES2` | same file — "overrides change only the fields they set and additions follow the built-ins" | Names `[tsc, typescript, gopls, rust-analyzer, clangd, json, eslint]`; rust-analyzer equals `{...base, settings, initOptions: settings["rust-analyzer"]}`; eslint keeps nested `rootMarkers` and the added-server defaults | `Passed` |
| `V4` | `S3` | `DES2` | same file — "an added server without a command is an error on its line" | One error, line 4 (`[lsp.servers.marksman]`), message contains `needs command and fileTypes` | `Passed` |
| `V50` | `S33` | `DES2` | same file — "exactly one TypeScript server passes the version gate for any major" | Majors `[undefined, 5, 6, 7, 8]`: `tsc` → `[F,F,F,T,T]`, `typescript` → `[T,T,T,F,F]`; complementary, so exactly one per major | `Passed` |
| `V11` | `S9` | `DES2` | same file — "fileTypes naming a note, base, text, or unknown type is an error on its line" | Each of `markdown`, `base`, `text`, `rustt` → one error on line 3 (the `fileTypes` key) naming `lsp.servers.gopls.fileTypes` | `Passed` |
| `V13` | `S10` | `DES7` | `bun test src/core/kernel/view/diagnostics.test.ts` — "a line with an error and a warning shows one error sign and both underlines" | Both input orders yield one `{line:12, sign:{text:"E"}}` and two marks (`diagnosticError` 13–16, `diagnosticWarn` 14–18); `layoutText` row 12 shows sign `E` and the error style at col 13 | `Passed` |
| `V14` | `S10` | `DES7` | same file — "ranges past the line end are clamped and ranges on missing lines are skipped" | End col 40 clamps to 5; a range ending on line 9 of a 2-line buffer clamps to line 1; lines 7, `-1`, `NaN` produce nothing; no throw from the provider or `layoutText` | `Passed` |
| `V14` (independent probe) | `S10` | `DES7` | Temporary scratch test (deleted after the run) over a 5-line buffer with lines 0–2 visible | A multi-line range clamps to the last visible line; an inverted range and a zero-width range at end of line widen to one character; the error mark is emitted last and wins over an overlapping info mark in `layoutText`; no throw | `Passed` |
| `V46` | `S7` | `DES5` | `bun run check` | biome clean (330 files), tsc clean, knip zero findings, 1110 pass / 0 fail across 101 files (includes `test/boundaries.test.ts`, 2 pass) | `Passed` |
| Config and kernel units | `S1`, `S3`, `S9`, `S10`, `S33`, `S34` | `DES2`, `DES7` | `bun test src/core/config src/core/kernel/view` | 57 pass / 0 fail across 7 files | `Passed` |
| Work-process id search | None | None | `rg "W261005GWLY\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b\|P1-G"` over the 12 files changed in `dc4e631..024d68a` | No matches (exit 1) | `Passed` |
| Persistence boundary | None | `DES5` | Inspection of `src/core/state/types.ts:PersistedState` | `PersistedState` is a separate explicit type and is unchanged; `LspState` is not persisted | `Passed` |
| Process cleanup | None | None | `pgrep -f fake-lsp` | Empty; no processes started | `Passed` |

## Findings

None

## Test Coverage

- **Covered:** `[lsp]` defaults; built-in table order; field-wise overrides, disabled built-ins, appended additions with defaults; rust-analyzer `initOptions` derived from `settings` and an explicit `initOptions` kept; incomplete addition as a line error; `fileTypes` enum errors on the key line; unknown keys under `[lsp]` and user-set `localBin` rejected; TypeScript gate split for known and unknown majors; one sign per line at the highest severity; one mark per range; per-severity signs; clamping past line end and past the buffer; skipped invalid start lines; zero-width widening; visible-range filtering; integration with `layoutText`.
- **Missing:** None for this group's cases. The rename branch in `src/ui/overlays/prompt.ts:layout` has no test, but it is unreachable until a `RenamePrompt` can be opened; the group that opens it (`P1-G2` `prepareRename`, `P1-G3-T2` submit) should assert the rename prompt's title, `invalid` line, and footer.

## Scope Changes

Each deviation recorded in the implementation report is justified against the design and plan:

1. **`severityRank` omitted.** The plan T2 file list and design §4 name it, but design §7 defines no shape and no plan task or design section consumes it. `bun run check` requires zero knip findings, so an export with no caller would fail the gate. `DiagnosticSeverity` already orders numerically (design §6). Accepted; a later group that needs it adds it with its caller.
2. **Compile guards outside the T3 file list.** The plan anticipates them (T3 step 1: "Existing prompt handlers that narrow on `op`/`newNote` must still compile; a `RenamePrompt` reaching them is handled in P1-G3-T2"). `rename?: never` on `ExplorerPrompt` and `NewNotePrompt` follows the design's `never` discriminator pattern and is required for the `p.rename !== undefined` check the P1-G3-T2 preview uses; value shapes of the existing prompts are unchanged. The guards are minimal:
   - `src/core/state/explorer.ts:promptKey` — `if (p.rename !== undefined) return none(s);` after the `<Esc>` close, placed for P1-G3-T2 to replace with the submit.
   - `src/ui/views/explorer.ts:treeField` — excludes rename prompts from in-tree editing.
   - `src/ui/overlays/prompt.ts:layout` — a rename layout (title, field, `invalid` line, `⏎ rename · esc cancel`) using existing tokens. No plan task names this layout; it is small, consistent with design §6 `RenamePrompt` (`invalid` shown), and must be kept by later groups.
3. **`src/core/config/toml.test.ts` updated.** The whole-config equality case now expects the `lsp` defaults; required by `ConfigSchema.lsp`.
4. **`LspOp`/`LspResult` and `lsp*` Action/Effect variants absent.** Deferred to P1-G2-T1 by the plan's group scope; consistent.

## Unverified Items

None

## Blockers

None
