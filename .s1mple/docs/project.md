# so

- **Last Modified:** 2026-10-03

Use this as the reusable baseline for discussion and plan inspection. Keep change-specific details in work documents. Cite important claims, distinguish rules from observations, and link authoritative sources instead of duplicating them.

## Purpose and Scope

`so` is a terminal editor for a folder of Markdown notes, run as `so [path]`. It is one Bun process with a pure TypeScript core: a language-neutral editor kernel (text, vim, commands, view) plus registered file types, driven by one-way state flow, thin I/O adapters, and an OpenTUI shell that draws only visible lines. Sources: `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-design.md` (initiative design), `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-system-design.md` (current work).

## Technology Stack

Versions are exact pins from `package.json`; `bunfig.toml` sets `[install] exact = true`, and `bun.lock` is committed and installed with `--frozen-lockfile`.

| Technology | Role | Version or configuration source |
|---|---|---|
| Bun | Runtime, package manager, test runner, bundler (`--compile`) | `1.4.2` — `package.json` `packageManager: "bun@1.4.2"` (the only Bun version source; CI's `oven-sh/setup-bun` reads it) |
| TypeScript | Primary language and type checker | `typescript` `7.0.2` — `tsconfig.json` |
| `@opentui/core` | Terminal renderer (only `src/ui` imports it) | `0.5.14` |
| `lowlight` | Syntax highlighting (`src/core/lang/code`) | `3.3.0` |
| `zod` | Config schema (`src/core/config`) | `4.6.5` |
| `ignore` | `.gitignore`-style exclusion (`src/workspace`) | `7.0.12` |
| `@types/bun` | Bun type definitions | `1.4.2` (dev) |
| `@biomejs/biome` | Formatter and linter | `2.5.15` (dev) — `biome.json` |
| `knip` | Unused files, exports, and dependencies | `6.39.0` (dev) — `knip.json` |
| `@xterm/headless` | Terminal emulator for PTY end-to-end tests | `6.0.0` (dev) |

## Repository and Component Map

Default branch: `main`. One package, no monorepo.

| Path | Role |
|---|---|
| `bin/so` | Executable entry: `#!/usr/bin/env bun` → `src/app/main.ts` |
| `src/app` | Composition root: wiring, effect runner, process lifecycle |
| `src/ui` | OpenTUI shell, input normalization, views, overlays |
| `src/workspace` | File-system, watcher, trash, and clipboard adapters |
| `src/core` | Pure product logic: `kernel`, `filetypes`, `lang`, `state`, `config` |
| `scripts` | Developer tools (`record-vim.ts`, `bench-gate.ts`) |
| `test` | Policy, boundary, vim, component, integration, e2e, and benchmark suites |
| `.github/workflows` | `ci.yml`, `release-please.yml`, `release.yml` |

## Architecture and Key Flows

```text
key → src/ui (normalize) → store.dispatch(action) → core update(state, action) → { state, effects }
                                                                                    │
                     src/ui repaints visible lines ◄── state        effects ──► src/app effect runner
                                                                                    │
                                              result actions ◄── src/workspace (fs, trash, clipboard)
```

`update` is pure and synchronous; adapters only execute effects and report results as actions. Saves are atomic (private `0600` temp file, fsync, rename) and keep mode, BOM, line endings, and the trailing newline; the watcher ignores the app's own operations.

## Boundaries and Dependencies

Import rules, enforced by `test/boundaries.test.ts` (`LAYER_RULES`):

```text
app → ui, workspace, preview, core        ui → core        workspace → core        preview → core
core → core only; no I/O, runtime (node:*, bun), or @opentui imports
core/kernel → kernel only, no packages    core/filetypes → kernel
core/lang, core/features → kernel, filetypes, lang, features, time
core/state, core/config → any core module; nothing else in core imports them
only src/ui imports @opentui/*
```

## Data and Contracts

- **Data Ownership and Storage:** Notes are plain files in the user's workspace folder, read and written as-is. No database.

| Contract | Source of truth |
|---|---|
| App state, actions, effects (one-way protocol) | `src/core/state/types.ts` — `AppState`, `Action`, `Effect`, `FsOp`; `createUpdate` in `src/core/state/update.ts`, `createStore` in `src/core/state/store.ts` |
| Editor kernel | `src/core/kernel/{text,editor,vim,commands,view}` — text buffer, vim engine (`handleKey`), `CommandRegistry`, `Keymap`, `layoutText` and decorations |
| File types and highlighting | `src/core/filetypes/registry.ts` (`FileTypeRegistry`), `src/core/lang/code` (language table, `lowlightHighlighter`), `src/core/lang/markdown/file-type.ts` |
| Effect execution | `src/app/effects.ts` — one serial file-system queue; writes queued behind a rename, move, or trash of their path follow it |
| Vim behaviour | `test/vim/expected.json`, recorded from Neovim 0.11.x over RPC by `bun run record:vim` |

## Engineering Standards and Patterns

Keep it lean and simple. Code carries no work-process identifiers (`.s1mple/S1MPLE.md` Implementation).

- **Language Rules:** [TypeScript](languages/typescript.md)
- **Pins:** every npm version is exact; GitHub Actions are pinned to a 40-character commit SHA with a `# <tag>` comment. `test/repo.test.ts` enforces both.

## Constraints

- No version range (`^`, `~`) in `package.json`; upgrades are deliberate PRs.
- No tool may depend on the TypeScript compiler API (TypeScript 7 ships none).
- `src/core` stays free of I/O, runtime, and UI imports.

## Development and Verification

- **Local Setup:** install Bun `1.4.2`, then `bun install --frozen-lockfile`. Run with `bun run dev` (no build step). `NO_COLOR` disables colour. `so --version` prints `package.json` `version`, or `SO_VERSION` when set at build time (release builds). PTY tests set `SO_TEST=1`, which alone enables the test-only hooks `SO_TEST_SLOW_WRITE` and `SO_TEST_THROW` in `src/app/main.ts`.
- **Scripts:**

  | Script | Command | Purpose |
  |---|---|---|
  | `dev` | `bun src/app/main.ts` | Run from source |
  | `check` | `biome check . && bun --bun run tsc --noEmit -p . && bun --bun run knip && bun test src test/boundaries.test.ts test/repo.test.ts test/vim` | Fast local gate: format, lint, types, unused code, unit suites (< 30 s) |
  | `test:ci` | `bun test test/ui test/integration test/e2e` | Component, integration, and PTY e2e suites |
  | `bench` | `bun scripts/bench-gate.ts` | Benchmark gate (median of 5 runs, 2× target) |
  | `build` | `bun build --compile src/app/main.ts --outfile dist/so` | Single binary |
  | `record:vim` | `bun scripts/record-vim.ts` | Record vim expectations from Neovim 0.11.x (local only) |

- **Test Layers:**

  | Layer | Location | Runs in |
  |---|---|---|
  | Unit | colocated `src/**/*.test.ts`, `test/vim`, `test/boundaries.test.ts`, `test/repo.test.ts` | `check` |
  | Component | `test/ui` | `test:ci` |
  | Integration | `test/integration` | `test:ci` |
  | End-to-end (PTY) | `test/e2e` | `test:ci` |
  | Benchmark | `test/bench` | `bench` (Linux CI only) |

- **CI Checks:** `.github/workflows/ci.yml` runs on `pull_request` to `main` only (no `push` trigger), with per-PR concurrency and `cancel-in-progress`. Job `check` (`ubuntu-24.04`) runs `bun run check`; job `test` (matrix `ubuntu-24.04`, `macos-15`) runs `bun run test:ci`, plus `bun run bench` on Linux.
- **Release:** `release-please.yml` (push to `main`) opens release PRs and calls `release.yml` when a release is created; `release.yml` also runs on `v*` tags. It builds four binaries on one runner, smoke-tests each on its native runner (`macos-15`, `macos-15-intel`, `ubuntu-24.04`, `ubuntu-24.04-arm`), and publishes only after every smoke job passes. Tags containing `-` publish as prereleases.

## Sources and Open Questions

- **Sources:** `package.json`, `bunfig.toml`, `tsconfig.json`, `biome.json`, `knip.json`, `.github/workflows/*`, `test/repo.test.ts`, `test/boundaries.test.ts`, `src/core/state/types.ts`, `src/app/{main,effects}.ts`; initiative design `rm261003abzp-design.md`.
- **Open Questions:** None.
