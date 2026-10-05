# W261005F2A7 Plan Context

## Status

`Ready`

## 1. Sources

| Source | Path | Use |
|---|---|---|
| s1mple instructions | `.s1mple/S1MPLE.md` | Workflow behavior and required context |
| Project document | `.s1mple/docs/project.md` | Reusable project baseline |
| System design | `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-system-design.md` (`Finalized System Design`) | Technical authority |
| UI design | `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-ui-design.md` (`Ready for Planning`); mockups `ui-mockups/` (`manifest.md` `Accepted`, `M1@R3`, `M2@R3`, `M3@R3`) | UI/UX authority |
| System requirements | `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-requirements.md` (`Ready for System Design`) | Required system behavior |
| UI requirements | `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-ui-requirements.md` (`Ready for UI Design`) | Required UI behavior |
| Research | `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-research.md` (`RF1`–`RF14`) | Relevant research findings |
| Discussion context | `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-discuss-context.md` | Work-specific findings and constraints |
| UI context | `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-ui-context.md` | Existing UI code and pattern evidence |
| Roadmap sources | Not applicable — standalone work (`w261005f2a7-discuss-context.md` §Roadmap Binding: `None — standalone work`) | — |
| Additional project files | `.s1mple/docs/languages/typescript.md`, `.s1mple/docs/communication.md`, `test/boundaries.test.ts`, `knip.json`, `test/support/{state,ui}.ts`, `test/integration/helpers.ts`, `test/e2e/pty.ts`, `scripts/bench-gate.ts`, `src/core/state/{types,save,result,commands,buffers,mouse,keys,status,whichkey,disk}.ts`, `src/core/kernel/view/{types,decorations,text-view}.ts`, `src/ui/{shell,theme}.ts`, `src/ui/editors/text-view.ts`, `src/ui/views/{cmdline,statusline}.ts`, `src/ui/overlays/host.ts`, `src/app/{main,effects,lifecycle}.ts`, `node_modules/@opentui/core/renderer.d.ts` | Confirm cited current shapes and test infrastructure |

## 2. Governing Design Handoff

### Source Authority

- **System design:** `w261005f2a7-system-design.md` — authoritative for architecture, state, contracts, files, symbols, wiring, runtime flows, failure policy, and system verification (`DES1`–`DES13`, `S1`–`S36`, `V1`–`V69`).
- **UI design:** `w261005f2a7-ui-design.md` — authoritative for look, wording, glyphs, tokens, layout, placement, responsive and accessibility behavior of the gutter, statusline, explorer, hunk float, which-key, message line, and hand-off (`UDES1@R1`–`UDES12@R1`, `US1@R1`–`US12@R1`, `UV1@R1`–`UV18@R1`).
- **Alignment:** Aligned. The UI design's Required System Support table (§1) maps every entry to `REQ4@R3` and `DES9`–`DES13`; the system design's UI Design Support Coverage (§1) mirrors it. The DES13 notice catalogue states it follows the UI catalogue (UI §7 Component: Git message catalogue), and the token names in DES10 equal the UI token table.

### Approved Direction

Add LazyVim-style Git awareness as one feature slice that follows the existing one-way protocol: pure algorithms in `src/core/features/git/`, all Git state and decisions in `src/core/state/git.ts`, every Git process in one argv adapter `src/workspace/git.ts`, a first-level git-dir watcher, a save-gated `runTool` effect executed by an app-level `ToolHost` that suspends a paint-guarded shell, and UI views that only paint derived state. Native writes are limited to stage hunk (save-gated, oid-guarded, serial) and reset hunk (one `applyBufferEdits` step). Signs use a new generic `changeSign` channel and a change column that exists only inside a repository; outside a repository every surface is byte-identical to v1. Canonical detail: system design §2–§7, §9; UI design §7.

### Design Coverage

| Source | Chain | Planning meaning | Canonical detail |
|---|---|---|---|
| System design | `REQ1@R2 → DES1, DES4, DES5, DES13 → S1–S6, S30, S34 → V1–V3, V10–V13, V20–V23, V36, V37, V40, V57, V62, V66` | Stage and reset hunk are the only native writes; conflict refusal, oid guard, intent-to-add, EOL and EOF handling | §5 Stage Hunk, Reset Hunk; §7 `patch.ts`, `git.ts` (state), `workspace/git.ts`; §9 DES4, DES5 |
| System design | `REQ2@R2 → DES9, DES13 → S12–S15, S31, S35 → V30, V33, V42, V50, V58, V60, V61, V67, V68` | Full-screen tool hand-off with flush, interrupt hold, suspend, foreign-mode reset, resume, refresh | §5 Tool Hand-off; §7 `tool-host.ts`, `shell.ts`, `lifecycle.ts`; §9 DES9 |
| System design | `REQ3@R1 → DES9, DES11, DES13 → S16, S17, S34 → V34, V43, V59, V66` | `git.tool` argv config; missing tool and no-repo notices without suspend | §7 `schema.ts`, `tool-host.ts`; §9 DES11 |
| System design | `REQ4@R3 → DES10–DES13 → S7–S11, S32–S34, S36 → V4–V6, V9, V14–V17, V24, V44–V47, V63–V66, V69` | Six sign kinds in a change column, navigation, preview, statusline segment, explorer markers, blame, which-key titles | §7 `signs.ts`, `status.ts`, `blame.ts`, kernel view files, UI files; §9 DES10–DES12 |
| System design | `REQ5@R2 → DES2, DES3 → S7, S18, S19 → V1–V8, V18, V25, V51` | Live buffer vs normalized index, bounded Myers, 100 ms debounce | §5 Live Hunks; §7 `diff.ts`, `index-text.ts`, `update.ts` |
| System design | `REQ6@R2 → DES6, DES7 → S20–S23 → V19, V26, V27, V38, V54–V56` | Coalesced lock-free refresh, git-dir watcher, failure tolerance | §5 Refresh; §7 `git-watcher.ts`, `effects.ts` |
| System design | `REQ7@R2 → DES6, DES8, DES13 → S24–S26, S34 → V14, V28, V29, V39, V53, V66` | Discovery after first frame, version gate 2.31, subfolder prefix, worktrees, unborn | §5 Discovery; §7 `workspace/git.ts`, `main.ts` |
| System design | `REQ8@R1 → DES9, DES13 → S27, S28, S35 → V31, V32, V68` | Save dirty buffers before the tool; a failed or blocked save cancels | §7 `git.ts` (`openTool`, pending), `save.ts` |
| System design | `REQ9@R1 → DES4, DES13 → S29, S34 → V20, V40, V57, V66` | Stage saves first; failed save stages nothing | §7 `git.ts` (`stageHunk`, `advanceGitPending`) |
| UI design | `UREQ1@R1 → UDES1@R1 → US1@R1 → UV1@R1, UV2@R1` | Leftmost Git column, v1 cells shifted right, hit-test and cursor agree | UI §7 Surface: Editor gutter; Component: Git sign column |
| UI design | `UREQ2@R1 → UDES2@R1 → US2@R1 → UV3@R1, UV4@R1, UV16@R1` | Glyphs `+ ~ _ ‾ ≃ ┆` in every view and theme; block rows carry the sign | UI §7 Component: Git sign column |
| UI design | `UREQ3@R1 → UDES3@R1 → US3@R1 → UV5@R1, UV6@R1` | Navigation, stage, reset wording; surfaces update together | UI §7 Component: Git message catalogue |
| UI design | `UREQ4@R1 → UDES4@R1 → US4@R1 → UV7@R1, UV16@R1` | `⎇ ref [op] +a ~c -r` after path, zero counts hidden, dropped first | UI §7 Component: Statusline Git segment |
| UI design | `UREQ5@R1 → UDES5@R1 → US5@R1 → UV8@R1` | Explorer `M S ? U` and folder `•`, no `D` | UI §7 Component: Explorer Git marker |
| UI design | `UREQ6@R1 → UDES6@R1 → US6@R1 → UV9@R1, UV10@R1` | Hunk float layout, cap, placement, dismissal | UI §7 Surface: Hunk preview float; Component: HunkView |
| UI design | `UREQ7@R1 → UDES7@R1 → US7@R1 → UV11@R1` | Which-key `+git` / `+hunk` rows | UI §7 Surface: Which-key popup |
| UI design | `UREQ8@R1 → UDES8@R1 → US8@R1 → UV12@R1` | Blame format and relative-date buckets | UI §7 Component: Git message catalogue |
| UI design | `UREQ9@R1 → UDES9@R1 → US9@R1 → UV13@R1` | Notice wording and three levels; `messageWarn` | UI §7 Surface: Message line; Component: Git message catalogue |
| UI design | `UREQ10@R1 → UDES10@R1 → US10@R1 → UV14@R1, UV15@R1` | Pre-suspend message painted once, nothing while suspended, restored screen | UI §7 Surface: Tool hand-off |
| UI design | `UREQ11@R1 → UDES11@R1 → US11@R1 → UV17@R1` | v1-identical rendering outside a repository | UI §7 Surfaces (Disabled state) |
| UI design | `UREQ12@R1 → UDES12@R1 → US12@R1 → UV18@R1` | 17 new tokens on existing palette keys; no existing token changes | UI §7 Component: Git theme tokens |

### Applicable Code Shapes

| Source shape | Target | Planning use |
|---|---|---|
| System §7 `diff.ts` | `src/core/features/git/diff.ts` — `Hunk`, `HunkKind`, `diffLines`, `MAX_EDIT` | Bounded Myers; kind classification; untracked option |
| System §7 `index-text.ts` | `src/core/features/git/index-text.ts` — `IndexText`, `normalizeIndexText` | Mirror `splitFile` (`src/core/state/buffers.ts:305-312`) |
| System §7 `patch.ts` | `src/core/features/git/patch.ts` — `hunkPatch` | Zero-context patch in index EOL form |
| System §7 `status.ts` | `src/core/features/git/status.ts` — `RepoStatus`, `FileStatus`, `parseStatus`, `Marker`, `explorerMarkers` | Porcelain v2 parse, prefix stripping, marker precedence |
| System §7 `blame.ts` | `src/core/features/git/blame.ts` — `BlameLine`, `parseBlame` | Both not-committed sentinels |
| System §7 `signs.ts` | `src/core/features/git/signs.ts` — `GIT_SIGNS`, `hunkSigns`, `hunkAt`, `nextHunkLine`, `prevHunkLine` | Sets only `changeSign`; visible-range only |
| System §7 kernel view | `src/core/kernel/view/{types,decorations,text-view}.ts` — `RenderLine.changeSign`, line `Decoration.changeSign`, `layoutLine`, `layoutText` (`lastChangeSignIn`) | Second sign channel; block-replace inheritance |
| System §7 `types.ts` | `src/core/state/types.ts` — `GitState`, `RepoInfo`, `IndexEntry`, `GitPending`, `StageReport`, `ToolResult`, Action/Effect/TimerId/Overlay members, message level | Closed unions; exhaustive switches |
| System §7 `update.ts` | `src/core/state/update.ts` — switch cases, `withGitDiffTimers`, `onTimerAction` routing | Central diff-debounce hook |
| System §7 `git.ts` | `src/core/state/git.ts` — `initialGit`, all `on*` handlers, `requestRefresh`, commands, pending gate, catalogue constants | Every Git transition and notice |
| System §7 `git-commands.ts`; UI §7 Which-key | `src/core/state/git-commands.ts` — `gitCommands`, `gitBindings`, `gitGroups` | Titles per UDES7 |
| System §7 `save.ts`, `result.ts`, `disk.ts`/`status.ts`/`keys.ts`/`mouse.ts`, `schema.ts` | listed files — `onSaved`, `onSaveFailed`, exported `blocked`, `MessageLevel`, `onFileChanged`, `StatusSegments.git`, `routeKey`, `pressStops`/`overlayGate`, `ConfigSchema.git` | Small hooks into existing reducers |
| System §7 `workspace/git.ts` | `src/workspace/git.ts` — `GitSpawn`, `Git`, `createGit`, `parseVersion`, `MIN_GIT`, `BASE` argv | Only adapter that spawns Git |
| System §7 `git-watcher.ts` | `src/workspace/git-watcher.ts` — `GitWatcher`, `watchGitDirs`, `IGNORED_NAME` | First-level multi-dir watch |
| System §7 `effects.ts`, `tool-host.ts`, `lifecycle.ts`, `main.ts` | `src/app/*` — `RunnerDeps`, git cases, `createToolHost`, `holdInterrupts`, construction and deferred detect | Wiring and terminal hand-off |
| System §7 `shell.ts` | `src/ui/shell.ts` — `Shell.flush/suspend/resume/resetForeignModes`, paint guard, `FOREIGN_MODES_RESET`, `HunkView` registration | Suspend-aware shell |
| UI §7 Editor gutter; System §7 UI files | `src/ui/editors/text-view.ts` — `gutterWidth(lineCount, change)`, `gutter` painter, provider list | Change column for paint, hit-test (`:457`), cursor (`:335`), paint (`:520`) |
| UI §7 Statusline Git segment | `src/ui/views/statusline.ts` — `Seg.parts`, `gitSegment`, drop list `[git, preview, words, view]` | Multi-token segment |
| UI §7 Explorer Git marker | `src/ui/views/explorer.ts` — `GIT_MARKERS`, row painter | Marker after `●` via `put` |
| UI §7 HunkView | `src/ui/overlays/hunk.ts` — `HunkView`, `KIND_LABEL`, `anchor` callback | Float layout, cap 12/8, below-else-above |
| UI §7 Message line | `src/ui/views/cmdline.ts` — `MESSAGE_TOKEN` lookup | `warn` → `messageWarn` |
| UI §7 Git theme tokens | `src/ui/theme.ts` — `TOKENS` additions | 17 tokens, values per UI table |

### Runtime Flow

```text
startup: first frame → setImmediate → git.detect(root) → gitDetected → onGitDetected
           → gitWatch(dirs) → runner creates watchGitDirs · requestRefresh (gitRefresh 200 ms)
open:    fileLoaded in repo → gitReadIndex → git.readIndex → gitIndexRead → diff now
type:    update wrapper sees text.version change → startTimer gitDiff:<id> 100 ms → onGitDiffTimer → hunks
refresh: saved | fileChanged | gitStaged | toolExited | gitDirChanged | gitDetected
           → gitRefresh timer → gitStatus effect → parseStatus → onGitStatus → gitReadIndex (changed paths) · gitWatch (head change)
stage:   <leader>ghs → stageHunk → [dirty: pending + writeBuffer → saved → advanceGitPending]
           → fresh diffLines → gitStage (serial queue, expectedOid) → add -N | ls-files oid check → apply --cached
           → gitStaged → catalogue notice · gitReadIndex · requestRefresh
reset:   <leader>ghr → resetHunk → applyBufferEdits (one undo step) [+ setBuffer finalNewline] → notice → autosave
tool:    <leader>gg → openTool → [dirty: pending + writeBuffer each] → pre-suspend message + runTool
           → ToolHost: which → shell.flush() → holdInterrupts → suspend → spawn(inherit) → finally reset modes · resume · release
           → toolExited → clear message · requestRefresh · read + gitReadIndex per open buffer
paint:   layoutFrame → hunkSigns → changeSign → gutter cell 0 (repo only); statusSegments.git; explorerMarkers; HunkView
```

### Roadmap Validation

None — standalone work

### Cross-Work Dependency Gates

None

## 3. Binding Constraints

| Constraint | Source | Planning implication |
|---|---|---|
| Plan behavior is not established | `.s1mple/S1MPLE.md` §3 Plan | Use the s1mple-plan skill defaults |
| Keep it lean and simple | `.s1mple/S1MPLE.md` §3 Implementation | No abstractions beyond the design; reuse existing patterns (`advanceQuit`, `detectTrash`, `searchMarks`, `noteGroups`) |
| No work-process identifiers in code, comments, identifiers, test names, SQL comments, or log messages | `.s1mple/S1MPLE.md` §3 Implementation; `docs/languages/typescript.md` Coding Conventions | Test names describe behavior; `V*`/`UV*`/`DES*` ids appear only in `.s1mple/` documents and commit bodies |
| Verification behavior is not established | `.s1mple/S1MPLE.md` §3 Verification | Use the design verification trees and project checks (`bun run check`, `bun run test:ci`, `bun run bench`, `bun run build`) |
| Delivery: open a PR, make CI pass, resolve conflicts with base; move the work folder `work/active/` → `work/done/` and update `.s1mple/` references; push again and CI must pass on the new head; never force-push or merge without user approval | `.s1mple/S1MPLE.md` §3 Delivery | Final group delivers on `feat/w261005f2a7-git-integration` (current branch); a goal path under `work/active/` goes stale after the move |
| Every delegated agent reads and follows `.s1mple/S1MPLE.md` and its required references | s1mple-plan Principle 1 | Include in every execution prompt |
| Communication rules for documents and chat | `.s1mple/docs/communication.md` | Plan documents lead with purpose; reports state completed, skipped, failed precisely |
| Layer rules: core imports only core and no I/O/runtime/`@opentui`; workspace → workspace + core; app → `src/` but no UI packages; only `src/ui` imports `@opentui/*` | `test/boundaries.test.ts:16-42`; `project.md` Boundaries | `features/git/*` and `state/git*.ts` stay pure; `tool-host.ts` takes a structural `screen`; escape bytes stay in `src/ui/shell.ts` |
| `update` pure and synchronous; timers runner-owned | `project.md` Architecture; `src/core/state/update.ts` | Git results enter only as actions; debounce via `startTimer` |
| No Git process before the first frame | `src/app/main.ts:362` (`setImmediate`) | Detect inside the deferred block |
| Argv spawning, no shell, injectable spawn | `src/workspace/system.ts`, `trash.ts` | `GitSpawn` injectable; contents only on stdin |
| No new npm dependency; exact pins; knip zero findings | `project.md` Pins; `knip.json` | In-repo Myers; every new export has a consumer |
| `bun run check` before committing | `docs/languages/typescript.md` Testing | Each group ends with a green `check` |
| CI runs only on `pull_request` to `main` | `project.md` CI Checks; memory `ci-pull-request-only` | CI evidence appears only after the PR opens |
| Feature branch before first commit; never commit on `main` | memory `feature-branch-for-work` | Work continues on `feat/w261005f2a7-git-integration` |
| Perf gates must not block development | memory `perf-gates-dont-block` | New `gitDiffKeystrokeP95` (24 ms) may be relaxed with quick speedups rather than stall |
| Subagents kill the processes they start | memory `subagent-process-cleanup` | Execution prompts require cleanup of PTYs, test apps, watchers, and temp repos |
| Live demos and manual checks in Ghostty with tui-test monitor sized to the window; no recording unless asked | memory `ghostty-for-live-demos` | `V61`, `UV15@R1`, `UV16@R1` run in Ghostty; written observations only |
| Never tag or publish a release | memory `manual-releases-only` | Delivery uses the PR only; no `v*` tag |

## 4. Supporting Evidence

### Requirements

| Requirement | Design coverage | Required outcome |
|---|---|---|
| `W261005F2A7-REQ1@R2` | `DES1`, `DES4`, `DES5`, `DES13` | Only stage hunk and reset hunk write; conflict refusal, oid guard, intent-to-add, EOL/EOF handled |
| `W261005F2A7-REQ2@R2` | `DES9`, `DES13` | Tool full screen, so suspended, Ctrl-C survives, foreign modes reset, refresh after exit |
| `W261005F2A7-REQ3@R1` | `DES9`, `DES11`, `DES13` | `git.tool` configurable; missing tool or no repo gives a notice |
| `W261005F2A7-REQ4@R3` | `DES10`–`DES13` | Signs in their own column, navigation, preview, stage/reset, statusline, explorer, blame |
| `W261005F2A7-REQ5@R2` | `DES2`, `DES3` | Live buffer vs index, normalized, bounded, debounced; untracked sign |
| `W261005F2A7-REQ6@R2` | `DES6`, `DES7` | Event-driven, coalesced, lock-free refresh; narrow git-dir watch with fallback |
| `W261005F2A7-REQ7@R2` | `DES6`, `DES8`, `DES13` | Any layout in one repo, worktrees, unborn, Git ≥ 2.31, silent without Git |
| `W261005F2A7-REQ8@R1` | `DES9`, `DES13` | Dirty buffers saved before the tool; failure cancels |
| `W261005F2A7-REQ9@R1` | `DES4`, `DES13` | Stage saves first; failed save stages nothing |
| `W261005F2A7-UREQ1@R1`–`UREQ12@R1` | `UDES1@R1`–`UDES12@R1` (one-to-one) | Per UI design §1 UI Requirement Coverage |

### Research Findings

| Finding | Relevance | Planning implication |
|---|---|---|
| `RF1` | gitsigns in-process diff vs index blob, 100 ms debounce, summary counts | `diffLines` in core; count rule in `statusSegments` |
| `RF2` | Zero-context patch via `git apply --cached --unidiff-zero` | `hunkPatch` header numbering; real-git test `V36` |
| `RF3` | Zero-context patches apply silently on a changed index | oid guard before apply; `V37` |
| `RF4` | EOL, BOM, encoding must match index form | `normalizeIndexText`; patch in index EOL; `V7`, `V8`, `V22`, CRLF `V36` |
| `RF5` | Reset is an ordinary buffer edit | `applyBufferEdits` one undo step |
| `RF6` | `--no-optional-locks` prevents index writes and watcher loops | `BASE` argv; `V38` mtime check |
| `RF7` | Non-recursive git-dir watch, lock-file filtering, worktree common dir | `watchGitDirs` target set and `IGNORED_NAME`; `V54` |
| `RF8` | One `rev-parse` resolves top level, git dir, common dir, prefix | `detect`; `V28` |
| `RF9` | Porcelain v2 `-z` scoped by pathspec is cheap | `status -- <prefix>`; folder aggregation without a repo walk |
| `RF10` | LazyVim/Helix save before lazygit and reload after | Save gate and post-tool re-read |
| `RF11` | OpenTUI suspend/resume restores own modes; kitty images deleted on suspend | `FOREIGN_MODES_RESET`, forced repaint, `V60`, manual `V61` |
| `RF12` | Ctrl-C during hand-off reaches shutdown | `holdInterrupts`; `V42`, `V50` |
| `RF13` | Single-line blame with `-L` and `--contents -`; two not-committed sentinels | `parseBlame`; `V24`, `V39` |
| `RF14` | Pure-JS Myers fast except when nothing matches | Common-line `Set` check and `MAX_EDIT`; `V4`, `V51` |

## 5. Project Implementation Context

### Relevant Structure

```text
src/
├── core/
│   ├── features/git/        [new] diff, index-text, patch, status, blame, signs (+ tests)
│   ├── kernel/view/         types.ts, decorations.ts, text-view.ts (+ text-view.test.ts)
│   ├── config/schema.ts     (+ schema.test.ts)
│   └── state/               types, update, save, disk, status, result, keys, mouse, init; [new] git.ts, git-commands.ts (+ tests)
├── workspace/               [new] git.ts, git-watcher.ts (+ tests)
├── app/                     effects.ts, lifecycle.ts, main.ts; [new] tool-host.ts (+ tests)
└── ui/                      shell.ts, theme.ts, editors/text-view.ts, views/{cmdline,statusline,explorer}.ts; [new] overlays/hunk.ts
test/
├── support/                 state.ts (testRegistries), ui.ts (mountShell, test shell); [new] git-repo.ts
├── integration/             helpers.ts (startApp); [new] git.test.ts
├── ui/                      [new] git.test.ts; __snapshots__/
├── e2e/                     pty.ts (runInPty); [new] git-tool.test.ts
└── bench/                   [new] git-diff.bench.ts
scripts/bench-gate.ts        TARGETS (+ gitDiffKeystrokeP95)
.s1mple/docs/project.md      git config key, module map, min Git 2.31
```

### Established Patterns

| Pattern | Evidence | Planning use |
|---|---|---|
| Save-gated continuation | `src/core/state/save.ts:133-191` (`onSaved` → `advanceQuit`, `onSaveFailed`) | `GitPending` and `advanceGitPending`/`cancelGitPending` |
| Deferred detection then announcing action | `src/app/main.ts:362-377` (`setImmediate`, `detectTrash` → `trashAvailable`) | `git.detect` → `gitDetected` |
| Late-bound runner dep | `src/app/main.ts:356` (`deps.exit = lifecycle.exitNow`) | `deps.tool = createToolHost(...)` |
| Serial mutating queue | `src/app/effects.ts:111-116` | `gitStage` on `serial` |
| Runner-owned debounce timers keyed by `TimerId` | `src/app/effects.ts:118`, `src/core/state/types.ts:59` | `gitDiff:<id>`, `gitRefresh` |
| Wrapper post-processing every transition | `src/core/state/update.ts:197-216` | `withGitDiffTimers` |
| Per-feature commands/bindings/groups merged in registries | `src/core/state/note-commands.ts:232-269`; `src/app/main.ts:131-162`; `test/support/state.ts:61-103` | `gitCommands`, `gitBindings`, `gitGroups` in both registries |
| `AppCommand` is a module-local alias of `Command<CommandContext, CommandResult>` | `src/core/state/commands.ts:50`; `note-commands.ts:32` | `git-commands.ts` declares the same local alias |
| State-derived decoration provider built in the UI | `src/ui/editors/text-view.ts:667-672` (`searchMarks(s.vim.search)`) | Append `hunkSigns(...)` when `s.git.repo` |
| Overlay view in `OverlayHost` list; `itemAt` inside, `outside` elsewhere | `src/ui/shell.ts:143-147`; `src/ui/overlays/host.ts:110`; `MouseTarget` `overlay`/`outside` at `src/core/state/types.ts:369-370` | `HunkView` registration and click-outside close |
| Framed float | `src/ui/overlays/host.ts:14-32` (`drawFrame` with `title`/`footer`) | HunkView frame |
| Statusline drop list | `src/ui/views/statusline.ts:26`, `:135` (`[preview, words, view]`) | `Seg.parts`; prepend `git` |
| Token shape `[fg, bg, attrs, NO_COLOR attrs]` | `src/ui/theme.ts:161-232` (`statusDirty`, `messageError`, `floatDim`, `diffAdd`, `signReveal`) | Add 17 tokens |
| Message painter two-level ternary | `src/ui/views/cmdline.ts:92-100` | Three-level lookup |

### Code Surfaces

| Path | Current symbol or wiring | Intended change | Evidence |
|---|---|---|---|
| `src/core/kernel/view/types.ts` | `RenderLine { sourceLine; spans; widget?; sign? }` | add `changeSign?: Sign` | `src/core/kernel/view/types.ts:45-50` |
| `src/core/kernel/view/decorations.ts` | line `Decoration { kind:"line"; line; style?; sign? }` | add `changeSign?: Sign` | `src/core/kernel/view/decorations.ts:20` |
| `src/core/kernel/view/text-view.ts` | `layoutLine` keeps last `sign`; block `replace` row carries no sign | merge `changeSign`; replace row inherits last `changeSign` | `src/core/kernel/view/text-view.ts:45`, `:100` |
| `src/core/state/types.ts` | `TimerId`, `Overlay`, `AppState`, `Action`, `Effect`, `message.level: "info" \| "error"` | git members; `MessageLevel` | `src/core/state/types.ts:59`, `:194`, `:379`, `:419`, `:430`, `:518` |
| `src/core/state/result.ts` | `message(s, text, level: "info" \| "error")` | `MessageLevel` with `warn` | `src/core/state/result.ts:12-21` |
| `src/core/state/save.ts` | module-private `blocked`; `onSaved`; `onSaveFailed` | export `blocked`; chain git pending and refresh | `src/core/state/save.ts:32`, `:133`, `:187` |
| `src/core/state/update.ts` | switch, wrapper, `onTimerAction` | git cases, diff timer hook, timer routing | `src/core/state/update.ts:128-233` |
| `src/core/state/disk.ts` | `onFileChanged` | chain `requestRefresh` | `src/core/state/disk.ts:37` |
| `src/core/state/status.ts` | `statusSegments` | `git?` segment | `src/core/state/status.ts:81` |
| `src/core/state/keys.ts`, `mouse.ts` | `routeKey`, `pressStops`, `overlayGate` | `gitHunk` close rules | `src/core/state/keys.ts:64`; `src/core/state/mouse.ts:80`, `:94` |
| `src/core/state/init.ts` | `initialState` | `git: initialGit` | `src/core/state/init.ts:7` |
| `src/core/config/schema.ts` | strict sections with `prefault({})` | `git.tool` | `src/core/config/schema.ts:46-105` |
| `src/app/effects.ts` | `RunnerDeps`, `createEffectRunner`, `serial` | `git`, `tool`, `watchGit` deps and six cases | `src/app/effects.ts:38`, `:104`, `:111` |
| `src/app/lifecycle.ts` | returns `{ exitNow }`; SIGINT → shutdown | `holdInterrupts` | `src/app/lifecycle.ts:31`, `:66-70` |
| `src/app/main.ts` | `registries()`, deps, `setImmediate` block | git registries, construction, deferred detect | `src/app/main.ts:131`, `:326-356`, `:362` |
| `src/ui/shell.ts` | `Shell { attach; copyOsc52; destroy }`; `paint` syncs `useMouse`; `repaint = requestRender` | `flush/suspend/resume/resetForeignModes`; paint guard; `HunkView` | `src/ui/shell.ts:85-92`, `:112`, `:143-147`, `:189-193`; `renderer.d.ts:426`, `:590-591` |
| `src/ui/editors/text-view.ts` | `gutterWidth(lineCount)` at three callers; provider list | `gutterWidth(lineCount, change)`; change cell painter; `hunkSigns` provider | `src/ui/editors/text-view.ts:51`, `:335`, `:457`, `:520`, `:670` |
| `src/ui/views/cmdline.ts` | level ternary | `MESSAGE_TOKEN` | `src/ui/views/cmdline.ts:92-100` |
| `src/ui/views/statusline.ts` | `Seg { text; token }`; drop list | `parts`; `gitSegment`; `git` first in drop list | `src/ui/views/statusline.ts:26`, `:135` |
| `src/ui/views/explorer.ts` | row painter with `●` | marker after `●` | `src/ui/views/explorer.ts:299-315` |
| `src/ui/theme.ts` | `TOKENS` | 17 Git tokens | `src/ui/theme.ts:161-232` |
| `test/support/state.ts` | `testRegistries()` | merge git commands, bindings, groups | `test/support/state.ts:61-103` |
| `test/support/ui.ts` | `mountShell`, test shell | test shell implements `flush` (resolves at once), `suspend`, `resume`, `resetForeignModes` as recorders | `test/support/ui.ts:74`, `:130`, `:179` |
| `test/integration/helpers.ts` | `startApp` builds `RunnerDeps` | supply `git`, `tool`, `watchGit` | `test/integration/helpers.ts:86` |
| `scripts/bench-gate.ts` | `TARGETS`, `BENCHES` | `gitDiffKeystrokeP95: 24` → `test/bench/git-diff.bench.ts` | `scripts/bench-gate.ts:8-23` |

### Verification Surfaces

| Suite or check | Location or command | Required verification |
|---|---|---|
| Core unit suites | `src/core/features/git/{diff,signs,index-text,status,patch,blame}.test.ts` | `V1`–`V8`, `V14`–`V17`, `V22`, `V24` |
| Kernel unit | `src/core/kernel/view/text-view.test.ts` | `V9`, `V63` |
| Reducer unit | `src/core/state/git.test.ts` | `V10`–`V13`, `V18`–`V21`, `V23`, `V25`–`V27`, `V31`, `V32`, `V34`, `V35`, `V66`, `V68`; `UV5@R1`, `UV12@R1`, `UV13@R1` (reducer part) |
| Commands unit | `src/core/state/git-commands.test.ts` | `V69`; `UV11@R1` |
| Config unit | `src/core/config/schema.test.ts` | `V43` |
| Theme unit | `src/ui/theme.test.ts` (new, colocated) | `UV18@R1` |
| Adapter contract (real git) | `src/workspace/git.test.ts` with `test/support/git-repo.ts` | `V28`, `V29`, `V36`–`V39`, `V62` |
| Watcher (real fs) | `src/workspace/git-watcher.test.ts` | `V54`, `V55` |
| App units | `src/app/{tool-host,lifecycle,effects}.test.ts` | `V30`, `V33`, `V59`; `V42`; `V40`, `V41` |
| Integration | `test/integration/git.test.ts` | `V56`–`V58` |
| UI | `test/ui/git.test.ts` (mounted shell) | `V44`–`V47`, `V60`, `V64`, `V65`, `V67`; `UV1@R1`–`UV4@R1`, `UV6@R1`–`UV10@R1`, `UV13@R1` (snapshot part), `UV14@R1`, `UV17@R1` |
| E2E PTY | `test/e2e/git-tool.test.ts` via `runInPty` | `V50` |
| Bench | `test/bench/git-diff.bench.ts`; `bun run bench` | `V51`, `V53` |
| Static and unit gate | `bun run check` | `V52` (biome, tsc, knip zero, unit suites) |
| CI suites | `bun run test:ci` | component, integration, e2e |
| Build | `bun run build` | `V52` produces `dist/so` |
| Manual | Ghostty (tui-test monitor), kitty, iTerm2, Terminal.app | `V61`, `UV15@R1`, `UV16@R1` — written observations |
| Existing suites unchanged | `test/ui/__snapshots__/*.snap`, `src/core/state/save.test.ts` | Outside a repository snapshots stay byte-identical (`UV17@R1`, `S32`); quit behavior unchanged |

## 6. Additional Inspections

| Planning question | Files inspected | Finding |
|---|---|---|
| Does `src/app` forbid all UI imports? | `test/boundaries.test.ts:16-21`; `src/app/main.ts:61-69`, `src/app/lifecycle.ts:5` | `src/app/` may import any `src/` module but no UI package (`packages: "no-ui"`). The structural `screen` type in `tool-host.ts` is still valid and keeps the host unit-testable; it is not required by the rule |
| Do the OpenTUI hooks the shell needs exist? | `node_modules/@opentui/core/renderer.d.ts:426`, `:590-591` | `idle()`, `suspend()`, `resume()` exist on `CliRenderer` |
| Does `fullText` exist for `git.ts`? | `src/core/state/buffers.ts:157`, `:166`, `:182` | `fullText`, `saveText`, `applyBufferEdits`, `setBuffer` exist and are exported |
| Is `AppCommand` exported? | `src/core/state/commands.ts:50`; `src/core/state/note-commands.ts:32` | Module-local alias; features redeclare it from exported `CommandContext`/`CommandResult` |
| Do the overlay mouse targets exist? | `src/core/state/types.ts:369-370`; `src/ui/overlays/host.ts:110` | `overlay` and `outside` targets exist |
| Does `floatDim` exist for the hunk float? | `src/ui/theme.ts:194` | Exists; reused unchanged |
| Is Git available for real-git tests? | `git --version`, `which lazygit` | Local Git 2.51.0 and lazygit present; CI images (`ubuntu-24.04`, `macos-15`) ship Git ≥ 2.31 (not re-verified here); CI tests use stub tools, never lazygit |
| Is there an existing theme unit test? | `src/ui/`, `test/ui/theme.golden.test.ts` | No `src/ui/theme.test.ts`; `UV18@R1` adds it |

## 7. Planning Gaps

| Gap | Classification | Evidence or blocker |
|---|---|---|
| Verification ids in system design §1/§4/§7/§9 differ from the §8 tree (e.g. `REQ6@R2` lists `V36`–`V38` while the watcher cases are `V54`, `V55` and integration is `V56`–`V58`; §4 places `V36`–`V39` in `test/integration/git.test.ts` while §8 puts them in `src/workspace/git.test.ts`; §7 `tool-host.ts` lists `V34` while §8 names `V59`; §7 `git.ts` lists `V22` while §8 puts it in `patch.test.ts`) | `Resolved from project evidence` | Treat §8 "Test Suites and Cases" as the canonical verification tree; §5 Verification Surfaces above follow it |
| `test/support/ui.ts` (test shell recorders) and `test/integration/helpers.ts` (`startApp` deps) are not in the §4 project tree | `Resolved from project evidence` | §6 `Shell` extension rules and §7 `effects.ts` Affected Consumers name both; plan them as modified files |
| `src/ui/theme.test.ts` (`UV18@R1`) is not in the §4 project tree | `Resolved from project evidence` | UI design `UV18@R1` names it; add as a new colocated unit test |
| `UV11@R1` says "production registries `registries()`", which is module-private in `src/app/main.ts:131` | `Resolved from project evidence` | `V69` uses `testRegistries()`, which merges the same `gitCommands`/`gitGroups` exports (§5 Registration); cover `UV11@R1` there without exporting `registries` |
| Stage-specific save-failure wording not in the UI catalogue | `Resolved from project evidence` | DES13 Tradeoffs keep `cannot save <path>` and `not staged: <path> could not be saved`; UI flow says "existing save failure notice" |
| Manual checks in kitty, iTerm2, Terminal.app (`V61`, `UV16@R1`) depend on terminals the executor may not have | `Resolved from project evidence` | Run in available terminals (Ghostty per memory); report any terminal not checked as skipped, not passed |

## 8. Planning Handoff

- **Scope:** Implement `DES1`–`DES13` and `UDES1@R1`–`UDES12@R1` with every `S`/`V` and `US`/`UV` case, the `project.md` update, and delivery per `.s1mple/S1MPLE.md`.
- **Primary boundaries:** `src/core/features/git`, `src/core/kernel/view`, `src/core/state` (git, types, update, save, disk, status, result, keys, mouse, init, git-commands), `src/core/config`, `src/workspace` (git, git-watcher), `src/app` (effects, tool-host, lifecycle, main), `src/ui` (shell, theme, editors/text-view, views/cmdline, statusline, explorer, overlays/hunk), `test/` support, integration, ui, e2e, bench, `scripts/bench-gate.ts`, `.s1mple/docs/project.md`.
- **Likely sequence:**
  1. Pure algorithms and kernel `changeSign` channel (`features/git/*`, kernel view) with unit tests.
  2. State model and reducers (`types`, `result` warn level, `git.ts`, `git-commands.ts`, `update`, `save`, `disk`, `status`, `keys`, `mouse`, `init`, config) with reducer tests and `testRegistries`.
  3. Workspace adapters (`workspace/git.ts`, `git-watcher.ts`, `test/support/git-repo.ts`) with real-git tests.
  4. App wiring (`effects`, `lifecycle`, `tool-host`, `main`, `startApp` deps) with unit and integration tests.
  5. UI surfaces (`shell` suspend/flush/guard, gutter change column, statusline, explorer, cmdline, `HunkView`, theme tokens, test shell) with UI tests, v1 snapshot stability, e2e, bench.
  6. Docs (`project.md`), full checks, manual terminal checks, PR and delivery.
- **Verification focus:** v1 byte-identical rendering outside a repository (`S32`, `UV17@R1`); stage correctness on real Git incl. CRLF, untracked, stale oid (`V36`, `V37`); no index writes (`V38`); hand-off ordering and terminal restoration (`V30`, `V33`, `V42`, `V50`, `V60`, `V67`, `UV14@R1`); paint/hit-test/cursor agreement (`V65`, `UV2@R1`); notice catalogue text and levels (`V66`, `UV5@R1`, `UV13@R1`); keystroke budget (`V51`).
- **Excluded scope:** Commit, push, pull, unstage, branch operations in so (lazygit handles them); inline blame; `.git-blame-ignore-revs`; stage/reset keys in the hunk float; `D` explorer marker and ghost rows; bar-style signs; polling fallback; non-EOL `.gitattributes` filters; JS Git libraries; releases or tags.
- **Blocking items:** None
