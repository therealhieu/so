# W261005GWLY Plan Part 1 — core

## Status

`Ready`

## Objective

Every LSP decision the core owns is implemented in `src/core` and proven with `createUpdate` unit tests, with no protocol type, process, or timer outside `startTimer` effects: the `[lsp]` config and built-in table, the kernel diagnostic decoration, `AppState.lsp`, request routing and staleness, diagnostics slots and the insert freeze, floats, pickers, commands and generated bindings, the one workspace-edit path, formatting, and code completion. Part 2 connects these reducers to real processes without changing their contracts.

## Coverage Summary

- **System Design:** `REQ1@R2, REQ2@R2, REQ3@R2, REQ4@R1, REQ5@R1, REQ6@R2, REQ7@R2, REQ8@R1, REQ9@R2, REQ10@R2, REQ11@R1, REQ13@R1, REQ14@R2 (core side); DES2, DES5–DES14, DES18, DES19 (core side); S1, S3, S4, S6–S21, S26–S29, S33, S34, S36–S40 (core side); V1, V3, V4, V5, V8, V9, V10, V11, V13, V14, V15, V16, V18, V19, V20, V21, V22, V23, V24, V25, V26, V35, V36, V37, V39, V40, V46, V49, V50, V58, V59, V60, V62`
- **UI Design:** `None`

## Sources

- Plan index: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-index.md`
- Plan context: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-context.md`
- System design: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-system-design.md`
- UI design: Not applicable — no UI design was authored; the system design covers the UI surfaces with existing tokens and overlays
- System requirements: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-requirements.md`
- UI requirements: Not applicable — none authored

## Dependencies

- None. Part 1 starts from `main` on branch `feat/w261005gwly-lsp-code-intelligence`.
- Every agent reads `.s1mple/S1MPLE.md` and its required references (`docs/communication.md`, `docs/project.md`, `docs/languages/typescript.md`) before editing.

## Execution Flow

```text
P1-G1: Contracts → P1-G2: Requests, diagnostics, and commands → P1-G3: Edits and completion
```

## Groups

### P1-G1 — Contracts

#### Goal

The pure contracts every later group builds on exist and are proven: `LspConfigSchema` inside `ConfigSchema`, the seven-entry `BUILTIN_SERVERS` table with `resolveServers` and `gateAllows`, the kernel `Diagnostic` type with `diagnosticMarks`, and the state types (`LspState`, `ServerView`, `CompletionState` code mode, `RenamePrompt`, new `TimerId`s) with `initialState().lsp`.

#### Coverage Summary

- **System Design:** `REQ1@R2, REQ2@R2, REQ5@R1, REQ6@R2; DES2, DES5, DES7; S1, S3, S9, S10, S33, S34; V1, V3, V4, V11, V13, V14, V46, V50`
- **UI Design:** `None`

#### Scope

- Included: `[lsp]` schema and built-in table; `ConfigSchema.lsp`; kernel diagnostic decoration; state types consumed by `AppState` and `initialState`.
- Excluded: the protocol packages and their `PACKAGE_HOMES` entries (P2-G1-T1: knip reports a dependency that nothing imports); `LspOp`, `LspResult`, and the `lsp*` `Action`/`Effect` variants (P1-G2-T1, where their handlers land, because knip reports unused exported types and the exhaustive `never` checks at `src/core/state/update.ts:194` and `src/app/effects.ts:506` need handlers in the same commit).
- Main files: `src/core/config/lsp.ts`, `src/core/config/lsp.test.ts`, `src/core/config/schema.ts`, `src/core/kernel/view/diagnostics.ts`, `src/core/kernel/view/diagnostics.test.ts`, `src/core/state/lsp-types.ts`, `src/core/state/types.ts`, `src/core/state/init.ts`
- Rules: read `.s1mple/S1MPLE.md` first; no work-process ids (work, REQ, DES, S, V, phase, goal, task) in code, test names, or logs; run `bun run check` before every commit and at group end; this group starts no processes.

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ1@R2 → DES2 → S1 → V1` | `None` | No `[lsp]` section parses to `enabled:false`, `formatOnSave:false`, `servers:{}` |
| `REQ2@R2 → DES2 → S3, S34 → V3, V4` | `None` | Built-ins in table order, field-wise overrides, disabled ones removed, additions appended; rust-analyzer `initOptions` from settings; incomplete addition is a line error |
| `REQ2@R2 → DES2 → S33 → V50` | `None` | Exactly one of `tsc`/`typescript` passes `gateAllows` per major, including unknown |
| `REQ5@R1 → DES2 → S9 → V11` | `None` | `markdown`, `base`, `text`, typos in `fileTypes` are errors on the key's line |
| `REQ6@R2 → DES7 → S10 → V13, V14` | `None` | One highest-severity sign per line, one mark per range, clamped, never throws |
| `REQ4@R1 → DES5 → S7 → V46` | `None` | State types compile into `AppState`; `bun run check` passes |

#### Cross-Work Gates

None

#### Tasks

##### P1-G1-T1 — `[lsp]` config schema and built-in table

- **Outcome:** `parseConfig` accepts and validates `[lsp]`; `resolveServers` and `gateAllows` behave as specified.
- **System Design:** `REQ1@R2, REQ2@R2, REQ5@R1; DES2; S1, S3, S9, S33, S34; V1, V3, V4, V11, V50`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `src/core/config/lsp.ts`, §7 `src/core/config/schema.ts`, §9 DES2, DES20 (marker table)
- **Files:** `src/core/config/lsp.ts` (`LSP_FILE_TYPES`, `LspConfigSchema`, `LspConfig`, `RootMarker`, `VersionGate`, `ServerSpec`, `BUILTIN_SERVERS`, `resolveServers`, `gateAllows`), `src/core/config/schema.ts` (`ConfigSchema.lsp`), `src/core/config/lsp.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V1, V3, V4, V11, V50`:** `src/core/config/lsp.test.ts` — cases as listed in design §8 `core/config/lsp.test.ts`.

   **Preview:**

   ```ts
   import { expect, test } from "bun:test";
   import { parseConfig } from "./toml";
   import { BUILTIN_SERVERS, gateAllows, resolveServers } from "./lsp";

   test("language servers are off when the config has no lsp section", () => {
     // parseConfig("") → config.lsp equals { enabled: false, formatOnSave: false, servers: {} }
   });
   test("overrides change only the fields they set and additions follow the built-ins", () => {
     // rust-analyzer settings override, pyright enabled = false, eslint added with nested rootMarkers
     // names → [tsc, typescript, gopls, rust-analyzer, clangd, json, eslint]
     // rust-analyzer: command unchanged, settings replaced, initOptions equal settings["rust-analyzer"]
   });
   test("an added server without a command is an error on its line", () => { /* message contains "needs command and fileTypes" */ });
   test("exactly one TypeScript server passes the version gate for any major", () => {
     // for major of [undefined, 5, 6, 7, 8]: tsc passes only 7, 8; typescript passes undefined, 5, 6
   });
   test("fileTypes naming a note, base, text, or unknown type is an error on its line", () => {
     // each of ["markdown"], ["base"], ["text"], ["rustt"] → ok false, error line = fileTypes key line
   });
   ```

   - Run `bun test src/core/config/lsp.test.ts` and confirm failure because `./lsp` does not exist.

2. **GREEN:** `src/core/config/lsp.ts`, `src/core/config/schema.ts` — symbols as in design §7.

   **Preview:**

   ```ts
   // schema.ts — one line inside ConfigSchema, after the existing sections
     lsp: LspConfigSchema.prefault({}),

   // lsp.ts — implement exactly the design §7 shape; only the resolver bodies are new here
   export function resolveServers(c: LspConfig): ServerSpec[] {
     // built-ins in BUILTIN_SERVERS order: merge the same-named entry field by field, drop enabled === false,
     //   rust-analyzer: initOptions ??= settings["rust-analyzer"] when that value is an object
     // then added names in Object.entries order with defaults rootSearch "nearest", snippets false, localBin false, no gate
   }
   export function gateAllows(gate: VersionGate, major: number | undefined): boolean {
     // undefined → gate.below !== undefined && gate.atLeast === undefined
     // else (atLeast === undefined || major >= atLeast) && (below === undefined || major < below)
   }
   ```

   - `fileTypes` is `z.enum(LSP_FILE_TYPES)`, so `parseConfig` maps the issue to the key line (`src/core/config/toml.ts:35-43`).
   - Keep `command` an argv array; `localBin` and `gate` stay out of `ServerEntry`.

3. **REFACTOR:** Keep marker constants (`TS_LOCKS`, `TS_MARKERS`, `TSC_PROBE`) private; no other cleanup.

   **Preview:**

   ```ts
   // allowed: naming and private helpers inside lsp.ts
   // not allowed: user-settable localBin/gate, changes to other ConfigSchema sections
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(config): add the lsp section and built-in server table

   Task: P1-G1-T1 — `[lsp]` config schema and built-in table
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V1, V3, V4, V11, V50` — `bun test src/core/config/lsp.test.ts` → all cases pass
- `V46` — `bun run check` → passes (existing config tests still green)

##### P1-G1-T2 — Diagnostic decoration provider

- **Outcome:** `diagnosticMarks(shown)` returns a provider that emits one highest-severity sign per visible line and one clamped mark per range.
- **System Design:** `REQ6@R2; DES7; S10; V13, V14`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `src/core/kernel/view/diagnostics.ts`
- **Files:** `src/core/kernel/view/diagnostics.ts` (`DiagnosticSeverity`, `Diagnostic`, `diagnosticMarks`, `severityRank`), `src/core/kernel/view/diagnostics.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V13, V14`:** `src/core/kernel/view/diagnostics.test.ts`

   **Preview:**

   ```ts
   test("a line with an error and a warning shows one error sign and both underlines", () => {
     // error + warning on line 12, cols 13–16 → exactly one line decoration {line: 12, sign: {text: "E"}}
     // two marks styled diagnosticError and diagnosticWarn over their ranges
   });
   test("ranges past the line end are clamped and ranges on missing lines are skipped", () => {
     // mark end col equals line length; no decoration for a line beyond the buffer; no throw
   });
   ```

   - Run `bun test src/core/kernel/view/diagnostics.test.ts` and confirm failure (module missing).

2. **GREEN:** `src/core/kernel/view/diagnostics.ts`

   **Preview:**

   ```ts
   export function diagnosticMarks(shown: readonly Diagnostic[]): DecorationProvider {
     return (v) => {
       // only diagnostics whose start line is in v.visible
       // per line: keep the lowest severity number → one line decoration with SIGN[severity]
       // per diagnostic: clamp to v.buf line count/line length; zero width → one char or to line end → one mark
     };
   }
   ```

   - Import only kernel modules (`core/kernel` rule in `test/boundaries.test.ts`).

3. **REFACTOR:** Share the clamp helper inside the file only.

   **Preview:**

   ```ts
   // allowed: private clamp/sign helpers; not allowed: changes to layoutText or text-view.ts
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(kernel): add diagnostic signs and underlines

   Task: P1-G1-T2 — Diagnostic decoration provider
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V13, V14` — `bun test src/core/kernel/view/diagnostics.test.ts` → pass
- `V46` — `bun run check` → pass

##### P1-G1-T3 — LSP state types

- **Outcome:** `AppState.lsp: LspState` exists with an empty initial value; `CompletionState`, `PromptState`, and `TimerId` carry the designed additions.
- **System Design:** `REQ4@R1, REQ8@R1, REQ10@R2; DES5, DES10, DES12; S7; V46`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `src/core/state/lsp-types.ts`, §7 `src/core/state/types.ts`, §6 `LspState`, `CompletionState` (code mode), `RenamePrompt`
- **Files:** `src/core/state/lsp-types.ts` (every §7 type except `LspOp` and `LspResult`), `src/core/state/types.ts` (`AppState.lsp`, `CompletionState.mode "code"` + `code?` + row `source?`, `RenamePrompt`, `TimerId` `completion`/`lspResolve`/`` `lsp:${number}` ``/`` `lspFormat:${BufferId}` ``), `src/core/state/init.ts` (`initialState().lsp`)
- **Execution Approach:** `Direct verification — type-only additions with an empty default; behaviour arrives with the reducers in P1-G2/P1-G3, and tsc plus the existing suites prove nothing regressed`

**Steps:**

1. `src/core/state/lsp-types.ts`, `types.ts`, `init.ts`

   **Preview:**

   ```ts
   // init.ts — inside initialState
   lsp: { servers: {}, attached: {}, diagnostics: {}, shown: {}, pending: {}, nextId: 1 },

   // types.ts — additions only, shapes from design §7 types.ts
   export type AppState = { /* existing fields */ lsp: LspState };
   type RenamePrompt = PromptBase & { rename: { key: ServerKey; path: string; pos: Pos; version: number }; op?: never; newNote?: never };
   export type PromptState = ExplorerPrompt | NewNotePrompt | RenamePrompt;
   // TimerId adds "completion" | "lspResolve" | `lsp:${number}` | `lspFormat:${BufferId}`
   ```

   - Use `import type`; omit optional fields instead of setting `undefined` (`exactOptionalPropertyTypes`).
   - Existing prompt handlers that narrow on `op`/`newNote` must still compile; a `RenamePrompt` reaching them is handled in P1-G3-T2.

2. **VERIFY — `V46`:**

   **Preview:**

   ```text
   bun run check
   └── Expect: biome, tsc, knip (zero findings), unit suites, boundaries, repo pins all pass
   ```

   - Run `bun run check` and inspect that knip reports no unused export from `lsp-types.ts`.

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): add language server state types

   Task: P1-G1-T3 — LSP state types
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V46` — `bun run check` → pass

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Pass with zero knip findings |
| Config and kernel units | `bun test src/core/config src/core/kernel/view` | All pass |
| Work-process ids | `rg "W261005GWLY\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b" src` | No matches in changed files |

#### Review and Verification Focus

- **Specification:** opt-in default, table order and fields exactly as design §7 and DES20, gate exclusivity, file-type enum, sign precedence and clamping.
- **Technical:** zod strictness kept, line-numbered errors, kernel import rules, `exactOptionalPropertyTypes`, no premature exports.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

### P1-G2 — Requests, diagnostics, and commands

#### Goal

Pure reducers route every LSP feature to the first capable server, drop stale and quiet results, time out user requests, keep pushed and pulled diagnostics per server with the insert-mode freeze, show and close floats, jump or open pickers for locations, and expose every command and generated binding for code file types only.

#### Coverage Summary

- **System Design:** `REQ2@R2, REQ3@R2, REQ4@R1, REQ5@R1, REQ6@R2, REQ7@R2, REQ13@R1, REQ14@R2; DES5, DES6, DES7, DES8, DES9, DES14, DES15, DES18, DES19; S4, S6, S7, S8, S9, S11, S12, S13, S26, S27, S28, S29, S35, S36, S39; V5, V8, V9, V10, V15, V16, V35, V36, V37, V39, V40, V49, V60`
- **UI Design:** `None`

#### Scope

- Included: `LspOp`/`LspResult`; five `lsp*` actions (`lspServer`, `lspAttached`, `lspDiagnostics`, `lspResult`, `lspMessage`) and four effects, each landing with its handler; `request`, `pickServer`, result branches for hover, locations, symbols, signature, prepareRename, none, error; timeouts; server views and messages; diagnostics slots, `syncDiagnostics`, `syncFloat`, `cursorDiagnostic`; `<Esc>` float close; `diagnostics`/`lspLocations`/`lspSymbols`/`lspInfo` picker sources; `lspCommands`, `lspBindings`, `lspGroups`, `formattingOptions`, `EX_ALIASES`; the runner's no-host answer; `testRegistries` registration.
- Excluded: `lspApplyEdit`, edit/actions/action/completion/completionItem result branches, the `lspActions` source, format results and format-on-save, completion (all P1-G3); host routing of effects (P2-G1); `main.ts` registration (P2-G1-T8).
- Main files: `src/core/state/lsp-types.ts`, `types.ts`, `lsp.ts`, `lsp.test.ts`, `update.ts`, `save.ts`, `keys.ts`, `lsp-pickers.ts`, `picker.ts`, `lsp-commands.ts`, `lsp-commands.test.ts`, `commands.ts`, `src/app/effects.ts`, `test/support/state.ts`
- Rules: read `.s1mple/S1MPLE.md` first; no work-process ids in code, test names, or logs; run `bun run check` before every commit and at group end; this group starts no processes.

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ2@R2 → DES6 → S4 → V5` | `None` | Request goes to the first ready server with the feature; diagnostics from both servers shown |
| `REQ4@R1 → DES5, DES14 → S7 → V9` | `None` | Each command emits its `op.kind` |
| `REQ4@R1 → DES6 → S8 → V10` | `None` | `hover: not supported by a` |
| `REQ6@R2 → DES7 → S12 → V15, V16` | `None` | Insert freeze; cursor diagnostic text |
| `REQ13@R1 → DES9 → S26, S27 → V35, V36` | `None` | One location jumps (`<C-o>` returns); several open `lspLocations`; outside counted |
| `REQ13@R1 → DES8, DES11 → S28 → V37, V49` | `None` | Floats close on cursor move, leaving insert, and `<Esc>` in normal mode |
| `REQ5@R1, REQ13@R1 → DES14 → S9, S26 → V39` | `None` | No markdown binding; Markdown `gd` still `link.followOrTag` |
| `REQ14@R2 → DES6 → S29, S39 → V40, V60` | `None` | Stale and quiet results change nothing |
| `REQ3@R2 → DES15 → S6, S35 → V8` | `None` | One toast per failure; none for unavailable; `lspInfo` rows |
| `REQ7@R2 → DES7, DES9, DES19 → S13, S36 → V17` | `None` | `diagnostics` source sorted by severity, path, position (end-to-end proof is V17 in P3-G1) |

#### Cross-Work Gates

None

#### Tasks

##### P1-G2-T1 — Request routing, results, and timeouts

- **Outcome:** `request` sends to the first capable server or explains why not; `onLspResult` applies fresh results and drops stale or quiet ones; `onLspTimeout` reports user timeouts; server views and messages update state and toasts.
- **System Design:** `REQ2@R2, REQ3@R2, REQ4@R1, REQ13@R1, REQ14@R2; DES5, DES6, DES9, DES15, DES18; S4, S6, S8, S27, S29, S35, S39; V5 (routing), V8 (toasts), V10, V35, V36, V40, V60`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `src/core/state/lsp-types.ts` (`LspOp`, `LspResult`), §7 `types.ts` (Action/Effect additions), §7 `src/core/state/lsp.ts`, §5 Request and result, §7 `src/app/effects.ts` (`run` no-host answer)
- **Files:** `src/core/state/lsp-types.ts` (`LspOp`, `LspResult`), `src/core/state/types.ts` (actions `lspServer`, `lspAttached`, `lspResult`, `lspMessage`; effects `lsp`, `lspCancel`, `lspReply`, `lspRestart`), `src/core/state/lsp.ts` (`pickServer`, `request`, `onLspResult`, `onLocations`, `onLspTimeout`, `onLspServer`, `onLspAttached`, `onLspMessage`), `src/core/state/update.ts` (four cases), `src/core/state/save.ts` (`onTimer` `lsp:` → `onLspTimeout`), `src/app/effects.ts` (`run` cases), `src/core/state/lsp.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V5, V8, V10, V35, V36, V40, V60`:** `src/core/state/lsp.test.ts` — state built with `fresh()` + `openBuffer` (set `fileType: "rust"`) and `lspServer`/`lspAttached` actions; cases per design §8 `core/state/lsp.test.ts`.

   **Preview:**

   ```ts
   const update = createUpdate(testRegistries());
   const ready = (name: string, features: LspFeature[]): ServerView =>
     ({ name, root: "/ws", state: "ready", features, pullDiagnostics: false, completionTriggers: [], signatureTriggers: [] });

   test("a request goes to the first attached server that supports the feature", () => {
     // attached [a@/ws (no hover), b@/ws (hover)] → request hover → effects contain {kind:"lsp", key:"b@/ws", op:{kind:"hover"}}
     // plus {kind:"startTimer", id:"lsp:1", ms:5000}
   });
   test("a feature no attached server supports explains why", () => { /* message "hover: not supported by a" */ });
   test("a result for an older buffer version changes nothing", () => { /* edit after request → hover result → float undefined, pending cleared */ });
   test("quiet errors show nothing", () => { /* error{quiet:true} → no message, pending has no id */ });
   test("one definition jumps and <C-o> returns", () => { /* locations [b.rs] → active path b.rs at range.start; <C-o> back */ });
   test("several locations open a picker and outside ones are counted", () => { /* 3 items, outside 2 → picker lspLocations, message contains "2 outside" */ });
   test("a failed server toasts once and an unavailable one never", () => { /* failed, failed again, unavailable → toasts.length 1 */ });
   test("a user request that times out reports it and cancels", () => { /* timer lsp:1 → message "hover: timed out", effect lspCancel */ });
   ```

   - Run `bun test src/core/state/lsp.test.ts` and confirm failures for the missing reducers.

2. **GREEN:** `lsp.ts`, `types.ts`, `lsp-types.ts`, `update.ts`, `save.ts`, `effects.ts`

   **Preview:**

   ```ts
   // update.ts step switch — four new cases (lspDiagnostics arrives with its reducer in P1-G2-T2)
   case "lspServer": return onLspServer(s, action);
   case "lspAttached": return onLspAttached(s, action);
   case "lspResult": return onLspResult(s, action);
   case "lspMessage": return onLspMessage(s, action);

   // save.ts onTimer
   if (kind === "lsp") return onLspTimeout(s, id);

   // effects.ts run — the runner without a language-server host
   case "lsp": d.dispatch({ type: "lspResult", id: e.id, result: { kind: "error", message: "language servers off" } }); return;
   case "lspCancel": case "lspReply": case "lspRestart": return;
   ```

   - `onLspResult` branches implemented here: `hover`, `locations` (`onLocations` with `recordJump` + `goTo`; single outside-only → `definition is outside the workspace: <path>`), `symbols`, `signature`, `prepareRename` (opens `RenamePrompt`), `none`, `error`. Leave `edit`, `actions`, `action`, `completion`, `completionItem` returning `none(s)` after clearing the pending entry; P1-G3 fills them.
   - `request` options `auto`, `replace`, `key` exactly as design §7; `auto` requests get no timer and silent errors.
   - `onLspServer`: `view: undefined` removes the key, its attachments, and its diagnostics; transition into `failed` toasts `<name> stopped: <reason>` once.

3. **REFACTOR:** Extract small private helpers in `lsp.ts` (pending removal, buffer lookup) without changing exports.

   **Preview:**

   ```ts
   // allowed: private helpers in lsp.ts; not allowed: new exported symbols beyond design §7
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): route language server requests and results

   Task: P1-G2-T1 — Request routing, results, and timeouts
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V5, V8, V10, V35, V36, V40, V60` — `bun test src/core/state/lsp.test.ts` → pass
- `V46` — `bun run check` → pass

##### P1-G2-T2 — Diagnostics, floats, and the cursor diagnostic

- **Outcome:** Pushed and pulled lists are stored per server; `shown` follows them except while the active window is in insert mode on that path; floats close on window, version, cursor, or mode change and on `<Esc>`; `cursorDiagnostic` returns the diagnostic under the cursor.
- **System Design:** `REQ6@R2, REQ7@R2, REQ13@R1; DES7, DES8, DES11, DES19; S4, S12, S28, S36; V5 (shown), V15, V16, V37, V49`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `src/core/state/lsp.ts` (`onLspDiagnostics`, `syncDiagnostics`, `syncFloat`, `cursorDiagnostic`), §7 `update.ts` (post-steps), §7 `keys.ts` (`<Esc>` float close), §5 Diagnostics
- **Files:** `src/core/state/types.ts` (`lspDiagnostics` action), `src/core/state/lsp.ts`, `src/core/state/update.ts` (`lspDiagnostics` case, wrapper), `src/core/state/keys.ts` (`handleKeyAction` `<Esc>`), `src/core/state/lsp.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V5, V15, V16, V37, V49`:** `src/core/state/lsp.test.ts`

   **Preview:**

   ```ts
   test("diagnostics from two servers are both shown", () => { /* push from a and b → shown[path].length 2 */ });
   test("diagnostics published in insert mode show after leaving insert mode", () => {
     // i → lspDiagnostics → shown equals old list → <Esc> → shown equals new list
   });
   test("the command line diagnostic is the one under the cursor", () => { /* cursorDiagnostic(s) → {severity: 1, text: "srv: msg"} */ });
   test("hover closes on cursor move and signature help on leaving insert mode", () => { /* float undefined after each */ });
   test("<Esc> in normal mode closes a hover float without moving", () => { /* float undefined; cursor and mode unchanged */ });
   ```

   - Run `bun test src/core/state/lsp.test.ts` and confirm the new cases fail.

2. **GREEN:** `lsp.ts`, `update.ts`, `keys.ts`

   **Preview:**

   ```ts
   // update.ts step switch
   case "lspDiagnostics": return onLspDiagnostics(s, action);
   // update.ts wrapper — design §7 update.ts
   const r = syncFloat(state, syncDiagnostics(state, syncEmbeds(
     state, followShownNote(state, syncEditorKinds(step(state, action), reg)), reg)));

   // keys.ts handleKeyAction — before routeKey
   const from = a.key === "<Esc>" && s.lsp.float !== undefined ? withoutFloat(s) : s;
   const r = routeKey(from, a, reg);
   // the existing maybeOpenCompletion line stays until P1-G3-T4
   ```

   - `onLspDiagnostics` replaces `diagnostics[path][key][source]`, pruning empty slots, keys, and paths.
   - Post-steps return `r` unchanged (same object) when nothing relevant changed and never emit effects.

3. **REFACTOR:** Share the merged-slots helper between `syncDiagnostics` and the `diagnostics` picker (P1-G2-T3 consumes it).

   **Preview:**

   ```ts
   // allowed: one exported-in-file helper for merging slots; not allowed: changing syncEmbeds order
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): keep diagnostics per server and close floats

   Task: P1-G2-T2 — Diagnostics, floats, and the cursor diagnostic
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V5, V15, V16, V37, V49` — `bun test src/core/state/lsp.test.ts` → pass
- Existing key behaviour — `bun test src/core/state/keys.test.ts` → pass

##### P1-G2-T3 — Diagnostics, locations, symbols, and server pickers

- **Outcome:** `openPicker` serves `diagnostics`, `lspLocations`, `lspSymbols`, and `lspInfo` from `LspState` only.
- **System Design:** `REQ3@R2, REQ7@R2, REQ13@R1; DES7, DES9, DES15; S6, S13, S27, S35; V8 (lspInfo rows), V36 (picker rows)`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `src/core/state/lsp-pickers.ts`, `picker.ts`
- **Files:** `src/core/state/lsp-pickers.ts` (`lspPickerSources` without `lspActions`), `src/core/state/picker.ts` (`pickerSources` spread), `src/core/state/lsp.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V8, V36`:** `src/core/state/lsp.test.ts`

   **Preview:**

   ```ts
   test("the server list shows missing binaries and unavailable servers with their reason", () => {
     // lspInfo rows: missing → "not on PATH"; unavailable → "unavailable: <reason>"; name@ key → "(no project)"
   });
   test("the diagnostics picker lists every diagnostic by severity, path, and position", () => {
     // pushed diagnostics for open and unopened paths → rows sorted; Enter on an unopened path → open request for that path
   });
   ```

   - Run the suite and confirm failure (sources missing).

2. **GREEN:** `lsp-pickers.ts`, `picker.ts`

   **Preview:**

   ```ts
   export const lspPickerSources: Readonly<Record<string, PickerSource>> = {
     diagnostics: { /* items from merged slots of every path, sorted; accept/preview by location */ },
     lspLocations: { /* items from s.lsp.list */ },
     lspSymbols: { /* items from s.lsp.symbols, indented by depth; accept goTo range start */ },
     lspInfo: { /* resolveServers(s.config.lsp) joined with s.lsp.servers; accept none */ },
   };
   // picker.ts: pickerSources = { ...existing, ...lspPickerSources }
   ```

   - Items are pure functions of state.

3. **REFACTOR:** Reuse `acceptLocation`/`previewLocation` across the three location sources.

   **Preview:**

   ```ts
   // allowed: shared private accept/preview helpers; not allowed: changes to existing picker sources
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): add diagnostics, location, symbol, and server pickers

   Task: P1-G2-T3 — Diagnostics, locations, symbols, and server pickers
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V8, V36` — `bun test src/core/state/lsp.test.ts` → pass
- Existing pickers — `bun test src/core/state/picker.test.ts` → pass

##### P1-G2-T4 — Commands and generated key bindings

- **Outcome:** Every LSP command exists with its op, keys are generated for every code file type and none for Markdown, ex aliases resolve, and `diag.next`/`diag.prev` wrap.
- **System Design:** `REQ4@R1, REQ5@R1, REQ7@R2, REQ11@R1, REQ13@R1; DES13, DES14; S7, S9, S11, S26; V9, V39`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `src/core/state/lsp-commands.ts`, `commands.ts` (`EX_ALIASES`)
- **Files:** `src/core/state/lsp-commands.ts` (`lspCommands`, `lspBindings`, `lspGroups`, `formattingOptions`, `formatCommand` request side, `restartAttached`), `src/core/state/commands.ts` (`EX_ALIASES` `Format`, `Diagnostics`, `LspInfo`, `LspRestart`), `test/support/state.ts` (`testRegistries` registers `lspCommands`, `lspBindings`, `lspGroups`), `src/core/state/lsp.test.ts`, `src/core/state/lsp-commands.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V9, V39`:** `src/core/state/lsp.test.ts` (`V9`, `V39` as in design §8), `src/core/state/lsp-commands.test.ts` (`]d`/`[d` wrap for S11; `formattingOptions` tabs vs spaces)

   **Preview:**

   ```ts
   test("each language feature command sends its operation", () => {
     // table: lsp.hover→hover, lsp.definition→definition, lsp.implementation→implementation, lsp.references→references,
     //   lsp.symbols→symbols, lsp.rename→prepareRename (server with prepareRename), lsp.codeAction→codeActions,
     //   lsp.signature→signature, lsp.complete→completion, lsp.format→format
   });
   test("no language binding exists for notes and gd in a note still follows links", () => {
     // lspBindings.every(b => b.scope.filetype !== "markdown"); keymap lookup gd in markdown → link.followOrTag
   });
   test("]d after the last diagnostic wraps to the first", () => { /* cursor on first diagnostic */ });
   ```

   - Run both suites and confirm failure.

2. **GREEN:** `lsp-commands.ts`, `commands.ts`, `test/support/state.ts`

   **Preview:**

   ```ts
   // lspCommands, KEYS, lspBindings as design §7 lsp-commands.ts
   export const lspGroups = { "<leader>x": "diagnostics" } as const; // same shape as existing *Groups, scoped to code file types
   // lsp.rename: server with prepareRename → request("prepareRename"); else open RenamePrompt prefilled with the word
   // lsp.format: request("format", {range from visual selection?, options: formattingOptions(b, tabWidth)}) — result handling in P1-G3-T3
   // lsp.restart: effect lspRestart{keys: wanted keys of the active buffer, including failed and unavailable}
   ```

   - `diag.list` and `lsp.info` have no `filetypes` restriction.
   - Register the new commands, bindings, and groups in `testRegistries` exactly as `main` will in P2-G1-T8.

3. **REFACTOR:** Keep `atCursor` and diagnostic navigation helpers private.

   **Preview:**

   ```ts
   // allowed: private helpers; not allowed: bindings for markdown, base, or text
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): add language server commands and key bindings

   Task: P1-G2-T4 — Commands and generated key bindings
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V9, V39` — `bun test src/core/state/lsp.test.ts src/core/state/lsp-commands.test.ts` → pass
- `V46` — `bun run check` → pass; `bun test test/vim` unchanged

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Pass with zero knip findings |
| Core state units | `bun test src/core/state` | All pass, existing suites unchanged |
| Work-process ids | `rg "W261005GWLY\|REQ[0-9]\|DES[0-9]" src test` | No matches in changed files |

#### Review and Verification Focus

- **Specification:** routing order and capability check, exact messages (`no language server for <ft>`, `<feature>: not supported by <names>`, `<feature>: timed out`, `N outside the workspace`), freeze rule, float close rules, picker sort order, binding set and Markdown isolation.
- **Technical:** reducer purity (time only through effects), exhaustive switches, post-steps return the same object when idle, `exactOptionalPropertyTypes`, no protocol imports in `src/core`.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

### P1-G3 — Edits and completion

#### Goal

Every server edit (rename, code action, `applyEdit`, format) goes through `startCodeEdit` with one undo step per open buffer, closed files on the serial queue, version refusal, and exactly one reply; format-on-save bounds `:w` at 1000 ms; code completion opens on triggers and pauses, ranks locally, and applies resolved or unresolved items exactly once with their auto-import edits and command.

#### Coverage Summary

- **System Design:** `REQ8@R1, REQ9@R2, REQ10@R2, REQ11@R1, REQ13@R1, REQ14@R2; DES6, DES10, DES11, DES12, DES13; S14, S15, S16, S17, S18, S19, S20, S21, S28, S37, S38, S40; V18, V19, V20, V21, V22, V23, V24, V25, V26, V58, V59, V62`
- **UI Design:** `None`

#### Scope

- Included: `SpanEdit.expected?`, `nextEditBatch`, `startCodeEdit`, `onCodeEditApplied`, `onEditsApplied` routing, `lspApplyEdit` action and `onLspApplyEdit`; `RenamePrompt` submit; `lspActions` source and action running; format results and `writeActive`; `completion`/`lspResolve`/`lspFormat:` timers; `maybeCompletion`, `codeCompletionStep`, `onCompletionTimer`, `rankCode`, `acceptCode`, `applyCompletion`, `onResolveTimeout`, `maybeSignature`.
- Excluded: runner writes and `lspHost.notify` (P2-G1-T7); completion row painting (P3-G1-T3).
- Main files: `src/core/features/links/rename.ts`, `src/core/state/lsp-edits.ts`, `lsp-edits.test.ts`, `link-edits.ts`, `explorer.ts`, `lsp-pickers.ts`, `lsp.ts`, `types.ts`, `update.ts`, `lsp-commands.ts`, `lsp-commands.test.ts`, `commands.ts`, `save.ts`, `code-completion.ts`, `code-completion.test.ts`, `completion.ts`, `keys.ts`
- Rules: read `.s1mple/S1MPLE.md` first; no work-process ids in code, test names, or logs; run `bun run check` before every commit and at group end; this group starts no processes.

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ10@R2 → DES12 → S17 → V22` | `None` | Open buffer edited in one undo step; closed file becomes `applyEdits` without `expected` |
| `REQ10@R2 → DES12 → S18 → V23` | `None` | Version mismatch refuses everything and replies `applied:false` |
| `REQ10@R2 → DES12 → S19, S40 → V24, V62` | `None` | Exactly one reply after `editsApplied`; skipped file named in `failureReason` |
| `REQ11@R1 → DES13 → S20, S21 → V25, V26` | `None` | `:Format` undoable; `:w` formats with 1000 ms bound; autosave never formats |
| `REQ8@R1 → DES10 → S14, S15 → V18, V19, V20` | `None` | Trigger and 150 ms timer; local re-rank; stale result opens nothing; link completion unchanged |
| `REQ9@R2 → DES10 → S16, S37 → V21, V58` | `None` | Main and additional edits in one undo step; cursor at `$0`; command after edits |
| `REQ9@R2, REQ14@R2 → DES10 → S38 → V59` | `None` | Resolve bounded at 500 ms; item applied exactly once; none after a version change |

#### Cross-Work Gates

None

#### Tasks

##### P1-G3-T1 — One workspace-edit path

- **Outcome:** `startCodeEdit` applies a `CodeEdit` across open and closed files, refuses mismatched versions or outside files, and emits exactly one `lspReply` when a reply is owed.
- **System Design:** `REQ10@R2; DES12, DES18; S17, S18, S19, S40; V22, V23, V24, V62`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `src/core/state/lsp-edits.ts`, `rename.ts`, `link-edits.ts`; §6 `SpanEdit.expected?`, `CodeEdit`; §5 Workspace edit
- **Files:** `src/core/features/links/rename.ts` (`SpanEdit.expected?`, `applySpanEdits`), `src/core/state/link-edits.ts` (`nextEditBatch`, `onEditsApplied` routing), `src/core/state/lsp-edits.ts` (`startCodeEdit`, `onCodeEditApplied`), `src/core/state/types.ts` (`lspApplyEdit` action), `src/core/state/lsp.ts` (`onLspApplyEdit`, `edit` result branch), `src/core/state/update.ts` (`lspApplyEdit` case), `src/core/state/lsp-edits.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V22, V23, V24, V62`:** `src/core/state/lsp-edits.test.ts` — cases per design §8 `core/state/lsp-edits.test.ts`.

   **Preview:**

   ```ts
   test("an edit over an open and a closed file edits the buffer and queues the file", () => {
     // a.ts open, b.ts closed → a.ts text changed in one undo step; effects [{kind:"applyEdits", edit:{path:"b.ts", edits:[no expected]}}]
   });
   test("a versioned edit for an older buffer applies nothing and says why", () => { /* version 3 vs 5 → unchanged, lspReply applied:false */ });
   test("a server edit is answered once after the closed files are written", () => { /* no reply before editsApplied; one after; toast "1 file changed" */ });
   test("a skipped file is named in the reply", () => { /* two closed files, one skipped → applied:false, failureReason contains "b.ts" */ });
   ```

   - Run `bun test src/core/state/lsp-edits.test.ts` and confirm failure.

2. **GREEN:** `rename.ts`, `link-edits.ts`, `lsp-edits.ts`, `lsp.ts`, `types.ts`, `update.ts`

   **Preview:**

   ```ts
   // rename.ts applySpanEdits — the only behavioural change
   if (e.expected !== undefined && text.slice(from, to) !== e.expected) return null;

   // link-edits.ts
   export const nextEditBatch = (s: AppState, now: number) =>
     Math.max(now, (s.index.rewrite?.batch ?? 0) + 1, (s.lsp.edit?.batch ?? 0) + 1);
   // onEditsApplied: s.lsp.edit?.batch === a.batch → onCodeEditApplied(s, a)

   // lsp.ts
   case "edit": return startCodeEdit(s, r.edit, { title: pending.feature });
   export const onLspApplyEdit = (s, a) => startCodeEdit(s, a.edit, { title: "edit", reply: { key: a.key, requestId: a.requestId } });
   ```

   - Link rename keeps setting `expected`; `bun test src/core/state/link-edits.test.ts` stays green.
   - Open buffers never go through the file queue.

3. **REFACTOR:** Replace the inline batch expression at `link-edits.ts:161` with `nextEditBatch`.

   **Preview:**

   ```ts
   // allowed: the shared batch helper; not allowed: changing link rewrite planning
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): apply server workspace edits through one path

   Task: P1-G3-T1 — One workspace-edit path
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V22, V23, V24, V62` — `bun test src/core/state/lsp-edits.test.ts` → pass
- Link rename regression — `bun test src/core/state/link-edits.test.ts src/core/features/links` → pass

##### P1-G3-T2 — Rename prompt and code actions

- **Outcome:** Submitting the rename prompt sends `rename`; `gra` results open the `lspActions` picker, and accepting an action applies its edit, resolves it first when the edit is missing, then sends its command; a failed resolve shows the server's message only.
- **System Design:** `REQ10@R2, REQ13@R1; DES12; S17, S19; integration proof V48 in P2-G1-T7`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `lsp-pickers.ts` (`lspActions`), §6 `RenamePrompt`, §5 Workspace edit (`gra` flow), §7 `lsp.ts` (`actions`/`action` branches)
- **Files:** `src/core/state/explorer.ts` (`promptKey` submit for `RenamePrompt`, `invalid` rule), `src/core/state/lsp-pickers.ts` (`lspActions`), `src/core/state/lsp.ts` (`actions`, `action` branches, `runAction`), `src/core/state/lsp-edits.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `S17, S19` (unit support for `V48`):** `src/core/state/lsp-edits.test.ts`

   **Preview:**

   ```ts
   test("submitting the rename prompt sends the new name", () => {
     // prepareRename result → prompt; empty or unchanged value → invalid; Enter with "next" → lsp op {kind:"rename", newName:"next"}
   });
   test("choosing a code action without an edit resolves it, applies it, then runs its command", () => {
     // actions result → picker lspActions; accept unresolved → lsp op resolveAction (pinned key);
     // action result with edit and command → edit applied, then lsp op executeCommand
   });
   test("a failed action resolve shows the server message", () => { /* error result for resolveAction → message "<server>: <reason>" */ });
   ```

   - Run the suite and confirm failure.

2. **GREEN:** `explorer.ts`, `lsp-pickers.ts`, `lsp.ts`

   **Preview:**

   ```ts
   // explorer.ts promptKey Enter
   if (p.rename !== undefined) return request(closePrompt(s), "rename", { kind: "rename", pos: p.rename.pos, newName: p.value }, { key: p.rename.key });

   // lsp.ts
   case "actions": return openPicker({ ...s, lsp: { ...s.lsp, actions: { key, path, items: r.items } } }, "lspActions");
   case "action": return runAction(s, r.action, key);
   // runAction: edit? startCodeEdit(then: command? request executeCommand) : resolved? command : request resolveAction {key}
   ```

   - Pin `key` for `resolveAction` and `executeCommand` to the server that produced the action.

3. **REFACTOR:** None beyond naming.

   **Preview:**

   ```ts
   // allowed: naming; not allowed: changes to ExplorerPrompt or NewNotePrompt behaviour
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): add symbol rename and code actions

   Task: P1-G3-T2 — Rename prompt and code actions
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `S17, S19` — `bun test src/core/state/lsp-edits.test.ts src/core/state/explorer.test.ts` → pass

##### P1-G3-T3 — Format results and format on save

- **Outcome:** `:Format` applies server edits as one undo step; with `formatOnSave`, `:w` formats first and writes on the result or after 1000 ms with a warning; autosave never formats.
- **System Design:** `REQ11@R1; DES13; S20, S21; V25, V26`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `lsp-commands.ts`/`commands.ts` (`writeActive`), §5 Format on save
- **Files:** `src/core/state/lsp-commands.ts` (`formatCommand` result path with `then`), `src/core/state/commands.ts` (`writeActive`), `src/core/state/save.ts` (`onTimer` `lspFormat:`), `src/core/state/lsp.ts` (format result into `startCodeEdit`), `src/core/state/lsp-commands.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V25, V26`:** `src/core/state/lsp-commands.test.ts`

   **Preview:**

   ```ts
   test(":Format applies the server edits as one undo step", () => { /* edit result → formatted; u → original */ });
   test("format on save formats :w only and never waits more than a second", () => {
     // :w → effects lsp format + startTimer lspFormat:<id> 1000, no write
     // autosave timer → write effect, no lsp effect
     // lspFormat timer → write effect + warning toast
   });
   ```

   - Run the suite and confirm failure.

2. **GREEN:** `lsp-commands.ts`, `commands.ts`, `save.ts`, `lsp.ts`

   **Preview:**

   ```ts
   // commands.ts writeActive — before writeBuffer
   if (ctx.state.config.lsp.formatOnSave && pickServer(ctx.state, b.path, "format") !== undefined)
     return formatCommand(ctx, { then: (s) => writeBuffer(s, b.id, ctx.now, { recreate: b.disk === "deleted" }) });

   // save.ts onTimer
   if (kind === "lspFormat") return onFormatTimeout(s, id, a.now); // drop pending, writeBuffer, warning toast
   ```

   - `s.lsp.format = {bufferId, requestId}` while waiting; the edit result clears it and runs `then`.

3. **REFACTOR:** None beyond naming.

   **Preview:**

   ```ts
   // allowed: naming; not allowed: touching the autosave path in save.ts
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): format code buffers and format on save

   Task: P1-G3-T3 — Format results and format on save
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V25, V26` — `bun test src/core/state/lsp-commands.test.ts` → pass
- Save regression — `bun test src/core/state/save.test.ts` → pass

##### P1-G3-T4 — Code completion trigger and ranking

- **Outcome:** In a code buffer in insert mode, a trigger character requests at once, an identifier character starts the 150 ms timer, results open the popup in `code` mode, and further typing re-ranks locally unless the list is incomplete or the word start moved; link completion is unchanged.
- **System Design:** `REQ8@R1, REQ14@R2; DES6, DES10; S14, S15; V18, V19, V20`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `code-completion.ts`/`completion.ts`/`keys.ts`, §6 `CompletionState` (code mode), §5 Completion
- **Files:** `src/core/state/completion.ts` (`maybeOpenCompletion` → `maybeCompletion(r, reg): Result`), `src/core/state/keys.ts` (`handleKeyAction`), `src/core/state/code-completion.ts` (`codeCompletionStep`, `onCompletionTimer`, `rankCode`, completion result handling), `src/core/state/lsp.ts` (`completion` branch), `src/core/state/save.ts` (`completion` timer), `src/core/state/code-completion.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V18, V19, V20`:** `src/core/state/code-completion.test.ts`

   **Preview:**

   ```ts
   test("a trigger character requests completion and an identifier waits for a pause", () => {
     // "." → lsp op {kind:"completion", trigger:"."}; "fo" → startTimer {id:"completion", ms:150}
   });
   test("typing narrows a complete list without a new request", () => { /* incomplete false → no lsp effect; true → one */ });
   test("a stale completion result opens nothing and link completion is unchanged", () => {
     // version changed → overlay none; "[[" in markdown → completion mode "notes"
   });
   ```

   - Run the suite and confirm failure.

2. **GREEN:** `completion.ts`, `keys.ts`, `code-completion.ts`, `lsp.ts`, `save.ts`

   **Preview:**

   ```ts
   // keys.ts handleKeyAction tail (design §7)
   return r.state.overlay.kind === "completion" || r.state.vim.mode === "insert"
     ? maybeCompletion(r, reg)   // maybeSignature joins in P1-G3-T5
     : r;

   // completion.ts
   export function maybeCompletion(r: Result, reg: Registries): Result {
     // code buffer → codeCompletionStep(r, key); markdown → { ...r, state: <existing link logic> }
   }
   ```

   - Update the second caller `insertItem` (`completion.ts:213`).
   - A result is shown only when `version` and word start still match.

3. **REFACTOR:** Remove every `maybeOpenCompletion` reference.

   **Preview:**

   ```text
   rg "maybeOpenCompletion" src test
   └── Expect: no matches
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): open code completion on triggers and pauses

   Task: P1-G3-T4 — Code completion trigger and ranking
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V18, V19, V20` — `bun test src/core/state/code-completion.test.ts` → pass
- Link completion regression — `bun test src/core/state/keys.test.ts src/core/state/links.test.ts` → pass
- Obsolete reference — `rg "maybeOpenCompletion" src test` → no matches

##### P1-G3-T5 — Completion accept, resolve, and signature help

- **Outcome:** Accepting applies the main edit and `additionalTextEdits` in one undo step with the cursor at `$0`, then sends the item's command; unresolved items wait at most 500 ms; an item applies exactly once and never after a version change; signature trigger characters open signature help.
- **System Design:** `REQ9@R2, REQ13@R1, REQ14@R2; DES10, DES11; S16, S28, S37, S38; V21, V58, V59`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `code-completion.ts` (`acceptCode`, `applyCompletion`, `onResolveTimeout`), `keys.ts` (`maybeSignature`), §6 `LspState.accept`
- **Files:** `src/core/state/code-completion.ts`, `src/core/state/completion.ts` (`completionKey` code accept), `src/core/state/keys.ts` (`maybeSignature`), `src/core/state/lsp.ts` (`completionItem` branch), `src/core/state/save.ts` (`lspResolve` timer), `src/core/state/code-completion.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V21, V58, V59`:** `src/core/state/code-completion.test.ts`

   **Preview:**

   ```ts
   test("an auto-import completion is one undo step", () => { /* line 0 = import; label on cursor line; u → original */ });
   test("a resolved item places the cursor at its stop and then runs its command", () => {
     // cursor = edit start + item.cursor; last effect lsp {op.kind:"executeCommand"} with no timer (auto)
   });
   test("a slow resolve applies the item once without waiting", () => {
     // accept unresolved → resolveCompletion + startTimer lspResolve 500; timer → applied + lspCancel; late result → nothing
     // second run: version changes before the result → nothing applied
   });
   ```

   - Run the suite and confirm failure.

2. **GREEN:** `code-completion.ts`, `completion.ts`, `keys.ts`, `lsp.ts`, `save.ts`

   **Preview:**

   ```ts
   export function applyCompletion(s: AppState, item: CodeCompletionItem, now: number, reg: Registries): Result {
     // one applyBufferEdits([main (item.edit or wordStart..cursor → insertText ?? label), ...item.additional])
     // cursor at main start + item.cursor, else main end; item.command → request("executeCommand", ..., {auto: true, key})
   }
   // keys.ts: maybeSignature(from, maybeCompletion(r, reg), a.key) — signature trigger in a code buffer → request signature {auto:true, replace:true}
   ```

   - `accept` exists only while the `lspResolve` timer runs; both paths check `accept.version`.

3. **REFACTOR:** Keep `rankCode` and accept helpers in `code-completion.ts`; no changes to link modes.

   **Preview:**

   ```ts
   // allowed: private helpers; not allowed: link completion key changes
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): accept code completions with bounded resolve

   Task: P1-G3-T5 — Completion accept, resolve, and signature help
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V21, V58, V59` — `bun test src/core/state/code-completion.test.ts` → pass
- `V46` — `bun run check` → pass

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Pass with zero knip findings |
| Core units | `bun test src/core` | All pass |
| Obsolete reference | `rg "maybeOpenCompletion" src test` | No matches |
| Work-process ids | `rg "W261005GWLY\|REQ[0-9]\|DES[0-9]" src test` | No matches in changed files |

#### Review and Verification Focus

- **Specification:** one reply per reply-carrying edit including refusals, `failureReason` text, link rename protection unchanged, `:w`-only formatting, 150 ms/500 ms/1000 ms bounds, exactly-once accept, Markdown link completion unchanged.
- **Technical:** single `applyBufferEdits` per buffer for undo, shared batch ids, timer cleanup on every exit path, no snippet syntax in the core.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ1@R2 → DES2 → S1 → V1` | `None` | `P1-G1` | `P1-G1-T1` |
| `REQ2@R2 → DES2 → S3, S33, S34 → V3, V4, V50` | `None` | `P1-G1` | `P1-G1-T1` |
| `REQ5@R1 → DES2 → S9 → V11` | `None` | `P1-G1` | `P1-G1-T1` |
| `REQ6@R2 → DES7 → S10 → V13, V14` | `None` | `P1-G1` | `P1-G1-T2` |
| `REQ4@R1 → DES5 → S7 → V46` | `None` | `P1-G1, P1-G2, P1-G3` | `P1-G1-T3` and every task's check |
| `REQ2@R2 → DES6 → S4 → V5` | `None` | `P1-G2` | `P1-G2-T1, P1-G2-T2` |
| `REQ4@R1 → DES5, DES14 → S7 → V9` | `None` | `P1-G2` | `P1-G2-T4` |
| `REQ4@R1 → DES6 → S8 → V10` | `None` | `P1-G2` | `P1-G2-T1` |
| `REQ3@R2 → DES15 → S6, S35 → V8` | `None` | `P1-G2` | `P1-G2-T1, P1-G2-T3` |
| `REQ6@R2 → DES7 → S12 → V15, V16` | `None` | `P1-G2` | `P1-G2-T2` |
| `REQ7@R2 → DES7, DES9 → S13 → V17 (core source; proof in P3-G1-T5)` | `None` | `P1-G2` | `P1-G2-T3` |
| `REQ13@R1 → DES9, DES18 → S26, S27 → V35, V36` | `None` | `P1-G2` | `P1-G2-T1, P1-G2-T3` |
| `REQ13@R1 → DES8, DES11 → S28 → V37, V49` | `None` | `P1-G2` | `P1-G2-T2` |
| `REQ5@R1, REQ13@R1 → DES14 → S9, S26 → V39` | `None` | `P1-G2` | `P1-G2-T4` |
| `REQ14@R2 → DES6 → S29, S39 → V40, V60` | `None` | `P1-G2` | `P1-G2-T1` |
| `REQ10@R2 → DES12 → S17, S18, S19, S40 → V22, V23, V24, V62` | `None` | `P1-G3` | `P1-G3-T1, P1-G3-T2` |
| `REQ11@R1 → DES13 → S20, S21 → V25, V26` | `None` | `P1-G3` | `P1-G3-T3` |
| `REQ8@R1 → DES10 → S14, S15 → V18, V19, V20` | `None` | `P1-G3` | `P1-G3-T4` |
| `REQ9@R2, REQ14@R2 → DES10, DES11 → S16, S28, S37, S38 → V21, V58, V59` | `None` | `P1-G3` | `P1-G3-T5` |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary; later gates are handed off explicitly.
- Every source obligation is covered.

Outputs consumed by Part 2: `LspConfig`, `ServerSpec`, `resolveServers`, `gateAllows`, `LSP_FILE_TYPES`; `Diagnostic`; every `lsp-types.ts` type including `LspOp`/`LspResult`; the six `lsp*` actions and four effects; `lspCommands`, `lspBindings`, `lspGroups`, `lspPickerSources`; `SpanEdit.expected?`; the runner's no-host answer for `lsp` effects. Outputs consumed by Part 3: `AppState.lsp` (`shown`, `float`, `attached`, `servers`), `cursorDiagnostic`, `CompletionState.code`.

## Planning Gaps

None
