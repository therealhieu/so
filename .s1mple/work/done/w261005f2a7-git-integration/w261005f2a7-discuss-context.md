# W261005F2A7: git-integration

## Sources

| Source | Use |
|---|---|
| `.s1mple/S1MPLE.md` | Discuss behavior and required context |
| `.s1mple/docs/project.md` | Reusable project baseline |
| `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-requirements.md`, `rm261003abzp-design.md` | v1 exclusion of Git integration and sync |
| `src/workspace/{ignore,watcher,system,trash}.ts`, `src/workspace/index-worker.ts` | `.git` exclusion, own-operation echo filtering, external process spawning |
| `src/app/{effects,main}.ts` | Effect runner and startup wiring |
| `src/core/state/{types,status}.ts`, `src/core/state/commands.ts` | Effect/Action protocol, statusline segments, command registry |
| `src/core/kernel/view/{types,decorations}.ts`, `src/ui/editors/text-view.ts`, `src/ui/views/{statusline,explorer}.ts`, `src/ui/overlays/conflict.ts` | Gutter sign cell, status row, explorer rows, existing line diff |
| `src/core/config/schema.ts`, `test/boundaries.test.ts` | Config sections and layer rules |

## Roadmap Binding

None — standalone work

### Previous Accepted Bindings

None

### Parent Synchronization

- **Registration or discussion update:** None

## 1. User Input

### Original Input

I want to develop git feature. provide the proposal

### Consolidated Requirement or Problem

Add Git awareness to so, a terminal Markdown-notes editor whose workspace is often a Git repository, so the user can see and act on the version-control state of their notes without leaving the editor. Scope (status display, diff/gutter, commit/sync, history) is to be clarified.

### Constraints and Assumptions

- The so v1 roadmap excluded Git by user choice: `rm261003abzp-requirements.md:12` ("no AI, chat, LLM, vault, or Git"), `:14` (binding user exclusions include Git), `:33` ("Git integration and sync — user exclusion"); `rm261003abzp-design.md:27` ("No network service, database, Git, or AI"). v1 is complete (commit `0f618ae`), so this work deliberately lifts that exclusion as new standalone work.
- `src/core` must stay free of I/O, runtime, and UI imports (`.s1mple/docs/project.md` Constraints); any Git process or file access lives in an adapter.
- No version ranges in `package.json`; any new dependency is an exact pin (`.s1mple/docs/project.md` Engineering Standards).
- The release is a single `bun build --compile` binary (`.s1mple/docs/project.md` Scripts); a native Git library would have to survive compilation.
- Keep it lean and simple; no work-process identifiers in code (`.s1mple/S1MPLE.md` Implementation).
- Benchmarks (keystroke, open, first frame) are gates that should not block development (project memory); Git work must not regress first frame or typing.
- Assumption: a `git` executable may or may not be on `PATH`; the workspace may or may not be inside a repository, and may be a subfolder of one.

## 2. Project Structure

- `src/workspace/ignore.ts` — exclusion matcher shared by explorer, watcher, and search; already reads nested `.gitignore` files with Git precedence.
- `src/workspace/watcher.ts` — recursive `fs.watch`, debounced, drops excluded paths and so's own operations.
- `src/workspace/system.ts`, `src/workspace/trash.ts` — existing precedent for spawning external commands via `Bun.spawn` with argv (no shell).
- `src/workspace/index-worker.ts` — worker thread scanning notes; uses the same matcher.
- `src/app/effects.ts` — effect runner; serial file-system queue; answers each fallible effect with one action.
- `src/app/main.ts` — composition root; deferred startup work after the first frame.
- `src/core/state/types.ts` — `AppState`, `Action`, `Effect`.
- `src/core/state/status.ts`, `src/ui/views/statusline.ts` — status row segments and painter.
- `src/core/kernel/view/types.ts`, `src/ui/editors/text-view.ts` — per-line `Sign` and the gutter sign cell.
- `src/ui/views/explorer.ts` — explorer rows (icon + name).
- `src/core/state/commands.ts` — command registry (`:` commands, palette).
- `src/ui/overlays/conflict.ts` — existing buffer-vs-disk line diff view.
- `src/core/config/schema.ts` — strict config schema with per-feature sections.
- `test/boundaries.test.ts` — layer and package-home enforcement.

## 3. Standards and Patterns

### Applicable Standards

- `.s1mple/docs/project.md` Boundaries — `core → core only`; only `src/ui` imports `@opentui/*`; `workspace → core`; `app → anything except UI packages`; enforced by `test/boundaries.test.ts:16-30` (`LAYER_RULES`).
- `.s1mple/docs/project.md` Architecture — `update` is pure and synchronous; adapters execute effects and report results as actions.
- `.s1mple/docs/project.md` Startup — first frame must not depend on workspace size; slow work starts in `setImmediate` (`src/app/main.ts:361-391`).
- `.s1mple/docs/project.md` Pins — exact npm versions; Actions pinned by SHA (`test/repo.test.ts`).
- `src/core/config/schema.ts:62-93` — strict schema; unknown keys are errors; each feature has its own section (`explorer`, `preview`, `daily`, `templates`) and top-level `mouse`.

### Existing Patterns

- `src/workspace/system.ts:17-45,91-99` — external commands run as argv via `Bun.spawn`, injectable launcher for tests, non-zero exit → rejected promise.
- `src/workspace/trash.ts:18,81-90` — platform tool detection with injectable `spawn`.
- `src/app/main.ts:376-389` — tool detection (`Bun.which`) after the first frame, result stored in deps and announced by an action (`trashAvailable`).
- `src/app/effects.ts:104-120` — mutating file-system effects share one promise chain (`serial`); reads run freely.
- `src/core/kernel/view/types.ts:21,49` and `decorations.ts:20` — a `line` decoration may carry a `Sign { text, style }`; `text-view.ts:50-51,540-560` paints it in a one-cell sign column after line numbers. Only `live-preview.ts:86-90` (fold markers) emits signs today.
- `src/core/state/status.ts:12-31` — `StatusSegments` derives status fields from `AppState`; `statusline.ts:45-50` drops low-priority segments on narrow terminals.
- `src/core/state/types.ts:166-175` — side panel kinds `backlinks | outline`.
- `src/ui/overlays/conflict.ts:18-60` — prefix/suffix-trimmed line diff (`lineDiff`) with `−`/`+` ops, local to the UI.
- `src/core/state/commands.ts:306-346` — commands are `{ id, title, run }` entries.

## 4. Architecture

```text
key → src/ui → store.dispatch(action) → core update(state, action) → { state, effects }
                                                                        │
        src/ui repaints ◄── state                     effects ──► src/app effect runner
                                                                        │
                                   result actions ◄── src/workspace adapters (fs, trash, clipboard, spawn)

watcher (fs.watch, matcher, ownOps) ──fileChanged──► store
                                    └─notify──────► index worker
```

- `src/core` — pure state, commands, decorations, status segments; would own any Git state model and its derivation.
- `src/workspace` — adapters; the natural home for invoking Git (process or file reads).
- `src/app` — wires adapters to effects and startup; owns timing (after first frame).
- `src/ui` — statusline, explorer, gutter, overlays paint state.

## 5. Code Flow

```text
startup: read config/state → first frame → setImmediate{ watchWorkspace, indexHost.start, detectTrash, detectClipboard }
edit:    key → update → write effect → runner serial queue → atomicWrite → ownOps.noteWrite → watcher drops echo
external change: fs.watch → isExcludedPath? drop → debounce 50 ms → lstat → ownOps.isOwn? drop → fileChanged
```

1. `ALWAYS_HIDDEN` (`src/workspace/ignore.ts:13-14`) hides every dot entry, so `.git/` is excluded from the explorer, index scan, search, and watcher (`ignore.test.ts:26,56`).
2. `watchWorkspace` (`src/workspace/watcher.ts:91-92`) drops excluded paths before debouncing, so changes under `.git/` (commits, checkouts, index updates) produce no events today.
3. Own writes are tracked by exact stamp (`watcher.ts:29-58`); a Git checkout that rewrites a note arrives as an external `changed` event and is handled by the existing disk-change path (reload or conflict dialog).
4. External commands are spawned only for clipboard, trash, and browser open; no command runs inside the workspace today.

## 6. Boundaries

### In Scope

- Detecting whether the workspace is inside a Git repository and whether Git is available.
- Showing Git state relevant to notes (to be clarified: branch, file status, line changes, history).
- Acting on Git state from the editor (to be clarified: stage, commit, pull/push, revert hunk).
- Config for the feature, following existing schema conventions.

### Out of Scope

- Hosting-provider features (pull requests, issues) — not implied by the input.
- Changes to the link index or note format.
- Non-Git version control systems.

### Interfaces and Dependencies

- Git executable (`git` on `PATH`) or a library; neither is used today.
- `Effect`/`Action` unions in `src/core/state/types.ts:430,518`.
- `Sign` gutter cell (`src/core/kernel/view/types.ts:21`).
- `StatusSegments` (`src/core/state/status.ts:12`).
- Explorer row painter (`src/ui/views/explorer.ts:279-300`).
- Exclusion matcher and watcher (`src/workspace/ignore.ts`, `watcher.ts`).
- Config schema (`src/core/config/schema.ts`).

## 7. Unknowns

- Which Git capabilities the user wants: read-only status, gutter diff, staging/commit, sync (pull/push), history/blame.
- Git executable vs. a JS library (e.g. isomorphic-git) vs. reading `.git` directly; compatibility with `bun build --compile` and the single binary.
- How Git state refreshes: the watcher drops all `.git/` events (`ignore.ts:13-14`, `watcher.ts:92`), so branch switches or commits made outside so are not observed today.
- Performance on large repositories (10,000 notes is the bench size); `git status` cost and whether it must run off the main thread.
- Whether workspace-as-subfolder-of-repo and worktrees/submodules must be supported.
- Interaction between Git operations that rewrite files (checkout, pull, revert) and open dirty buffers, autosave, and the conflict dialog.
- Credentials and network for push/pull in a TUI (prompts, SSH agents) — conflicts with the v1 "no network service" stance.
- Whether the existing `lineDiff` in `src/ui/overlays/conflict.ts` should be reused (it lives in `src/ui`, so `src/core` cannot import it).
- Whether a Git status display competes for space with existing statusline segments on narrow terminals.
