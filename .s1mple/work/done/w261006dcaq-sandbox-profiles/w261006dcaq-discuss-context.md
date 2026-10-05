# W261006DCAQ: sandbox-profiles

## Sources

| Source | Use |
|---|---|
| `.s1mple/S1MPLE.md` | Discuss behavior and required context |
| `.s1mple/docs/project.md` | Reusable project baseline |
| `scripts/sandbox.ts`, `package.json`, `.gitignore`, `knip.json`, `tsconfig.json`, `.github/workflows/ci.yml` | Current sandbox behavior and how `scripts/` is checked |
| `test/fixtures/**`, `test/fixtures/generate.ts` | Fixture content a profile can stage |
| `test/e2e/pty.ts`, `scripts/record-vim.test.ts`, `src/app/main.ts` | How tests isolate config, state, and env; the so CLI and env surface |
| `feat/w261005f2a7-git-integration:test/support/git-repo.ts`, `…:test/e2e/git-tool.test.ts` (PR #10, open) | How Git scenarios are staged in isolation |
| `origin/feat/w261005gwly-lsp-code-intelligence` diff vs `main` (PR #11, open) | Config and fixture changes LSP adds |
| `.s1mple/docs/languages/typescript.md` | Toolchain and coding rules for `scripts/*.ts` |

## Roadmap Binding

None — standalone work

### Previous Accepted Bindings

None

### Parent Synchronization

- **Registration or discussion update:** None

## 1. User Input

### Original Input

"i need something like: bun run sandbox --profile <profile> — used for manual verification with e2e journeys. Provide the proposal. Selected options/designs should be stable, simple, easy to maintain and extend + meet industry standards."

### Consolidated Requirement or Problem

The current `bun run sandbox` stages exactly one demo vault under `.sandbox/` with isolated XDG config and state. Manual verification of end-to-end journeys (editing, links and index, live and browser preview, daily notes, templates and Bases, mouse, Git integration, and the LSP work in flight) needs different starting conditions: other vault content, a `config.toml`, a Git repository, or extra environment. The developer wants `bun run sandbox --profile <profile>` to launch so on a named, reproducible scenario per journey, while staying simple, stable, and easy to extend.

### Constraints and Assumptions

- Work runs on `feat/w261006dcaq-sandbox-profiles`, branched from `main` at `0f618ae`. Git integration (PR #10) and LSP (PR #11) are open and not on `main`, so `main`'s so has no Git or `[lsp]` behavior yet; `main`'s `project.md` mentions neither.
- The sandbox is a developer tool, not product code: it lives in `scripts/`, stays out of `src/`, and never ships in the binary (`package.json:15` builds only `src/app/main.ts` and the worker).
- `bun run sandbox` with no profile must keep working as today (assumption: today's vault becomes the default profile).
- Code carries no work-process identifiers (`.s1mple/S1MPLE.md` Implementation).
- Any process a run starts must be stopped by the agent that starts it (user memory: subagent process cleanup).
- Releases are manual; this work does not touch `release.yml`.

## 2. Project Structure

- `scripts/sandbox.ts` — the whole current sandbox: staging, argument handling, XDG isolation, spawn, and signal forwarding (95 lines).
- `package.json:17` — `"sandbox": "bun scripts/sandbox.ts"`.
- `.gitignore:46-47` — `.sandbox/` is ignored.
- `.sandbox/` — persisted state from earlier runs: `vault/` and `xdg/` (`xdg/config`, `xdg/state`).
- `test/fixtures/workspace/` — the main fixture vault: `tasks/*.md`, `tasks.base`, `notes/{ideas,todo}.md`, `templates/{daily,meeting}.md`, `crlf-bom.md`, `photo.png`, `.gitignore`, `.env`, `pkg/`, `build/`, `scripts/sync.ts`, plus `nul-at-100.bin` and `invalid-utf8.txt`, which the sandbox skips.
- `test/fixtures/tour.md` — the Markdown feature tour (callouts, tasks, tables, footnotes, links to `so-roadmap`).
- `test/fixtures/images/` — `wide.png`, `diagram.png`, `broken.png`, `logo.svg`.
- `test/fixtures/bases/` — Bases edge cases (`alfred/*.base`: broken, malformed, no-views, column sizes, group-by) and `group-order.base`.
- `test/fixtures/markdown-corpus/` — `gfm.md`, `obsidian.md`, `frontmatter.md`, `links.md`, `hidden.md`, `wrapped.md`.
- `test/fixtures/generate.ts:5-103` — generators: `makeLargeFile`, `make5000LineNote`, `make5000LineTs`, `notePath`, `makeNoteWorkspace` (10,000-note vaults for benches).
- `test/e2e/pty.ts` — PTY harness with private XDG folders and a written `config.toml`.
- `scripts/record-vim.test.ts` — the only test of a script; it spawns the script with a stub binary.
- PR #10 only: `test/support/git-repo.ts` (isolated temp repos) and `test/e2e/git-tool.test.ts`.
- PR #11 only: `src/core/config/lsp.ts` (`[lsp]` table) and `test/fixtures/fake-lsp.ts` (219-line fake server).

## 3. Standards and Patterns

### Applicable Standards

- `.s1mple/docs/languages/typescript.md:32` — knip entries are `scripts/*.ts` and `test/**/*.ts`; a new script file is an entry automatically, and a helper module imported only by a script must be under one of those globs or knip reports it.
- `tsconfig.json:14` — `"include": ["src", "test", "scripts"]`; scripts are type-checked by `bun run check`.
- `.s1mple/docs/languages/typescript.md:37-38` — keep it lean; domain names only; no work-process identifiers.
- `.s1mple/docs/languages/typescript.md:52-55` — `bun test`, behavior-named tests, `bun run check` before committing.
- `package.json:12` — `check` runs `bun test src test/boundaries.test.ts test/repo.test.ts test/vim`; `package.json:13` — `test:ci` runs `test/ui test/integration test/e2e`. Neither runs `scripts/**/*.test.ts`, so `scripts/record-vim.test.ts` runs in no CI job (`.github/workflows/ci.yml:17,28`). A sandbox test must sit in a run path to count.
- `project.md` Pins and `test/repo.test.ts` — exact npm pins, SHA-pinned Actions; a new dependency is a deliberate change.
- `src/core/config/schema.ts` — `ConfigSchema` is strict: an unknown key is an error, so a profile's `config.toml` must match the schema of the branch it runs on (for example `[lsp]` exists only on PR #11, `[git]` only on PR #10).

### Existing Patterns

- `scripts/sandbox.ts:64-67` — the argument handling is a hand filter, not `parseArgs`: `--` is dropped, `--reset` is consumed, and everything else passes to so.

  ```ts
  const argv = process.argv.slice(2).filter((a) => a !== "--");
  const reset = argv.includes("--reset");
  const passthrough = argv.filter((a) => a !== "--reset");
  ```

- `scripts/sandbox.ts:69-70` — stage once, then persist: the vault is staged only when `.sandbox/vault` is missing, so edits survive between runs until `--reset`.
- `scripts/sandbox.ts:39-62` — staging copies fixtures with a skip list, writes an inline `ROADMAP` note, and writes daily notes for 1, 2, and 5 days ago relative to the local date, leaving today absent so `:Today` creates it.
- `scripts/sandbox.ts:71-88` — isolation by `XDG_CONFIG_HOME` and `XDG_STATE_HOME` under `.sandbox/xdg/`; no `config.toml` is written, so the sandbox runs with defaults (notes open in `reading`).
- `scripts/sandbox.ts:89-92` — the wrapper forwards `SIGHUP` and `SIGTERM` to so and exits with its code.
- `test/e2e/pty.ts:121-136` — tests use the same isolation and write a `config.toml` (`[preview] mode = "live"`) before spawning.

  ```ts
  const state = await mkdtemp(join(tmpdir(), "so-pty-state-"));
  await mkdir(join(state, "config/so"), { recursive: true });
  await writeFile(join(state, "config/so/config.toml"), '[preview]\nmode = "live"\n');
  ```

- `feat/w261005f2a7-git-integration:test/support/git-repo.ts:13-26` (PR #10) — Git scenarios use an isolated environment: own `HOME`, `GIT_CONFIG_NOSYSTEM=1`, empty `GIT_CONFIG_GLOBAL`, `LANG=C`, and a fixed author and committer, on branch `main`.
- `feat/w261005f2a7-git-integration:test/e2e/git-tool.test.ts` (PR #10) — a stub tool script plus `[git] tool = [...]` in `config.toml` stands in for lazygit.
- `scripts/record-vim.test.ts:6-25` — a script is tested by spawning it with `Bun.spawn` and asserting exit code and stderr.

## 4. Architecture

```text
bun run sandbox [--reset] [so args]
        │
        ▼
scripts/sandbox.ts ── stage() once ──► .sandbox/vault   (copied from test/fixtures + generated notes)
        │
        ├── mkdir .sandbox/xdg/{config,state}
        │
        └── Bun.spawn(bun src/app/main.ts .sandbox/vault …args)
              env: XDG_CONFIG_HOME, XDG_STATE_HOME (+ inherited env)
              stdio: inherit; SIGHUP/SIGTERM forwarded
```

- `scripts/sandbox.ts` — owns staging, isolation, and launching; one fixed scenario.
- `test/fixtures/` — the content source shared with tests; the sandbox reads it and never writes it.
- `.sandbox/` — the persisted, gitignored output (vault plus XDG folders).
- `src/app/main.ts` — so itself: reads `config.toml` from `XDG_CONFIG_HOME`, state from `XDG_STATE_HOME`, takes one optional path (`src/app/main.ts:95-117`), and honours `NO_COLOR`, `SO_LOG=debug`, and test-only `SO_TEST*` hooks (`src/app/main.ts:224-245`).

## 5. Code Flow

```text
argv → drop "--" → --reset? rm -rf .sandbox
     → .sandbox/vault missing? stage()
     → mkdir xdg dirs → print "sandbox: .sandbox/vault (--reset to restage)"
     → spawn so on the vault → forward signals → exit with so's code
```

1. `bun run sandbox` runs `bun scripts/sandbox.ts` with the user's arguments (`package.json:17`).
2. `--reset` deletes all of `.sandbox/`, including XDG state (`scripts/sandbox.ts:69`).
3. When `.sandbox/vault` is missing, `stage()` copies `test/fixtures/workspace` (minus `SKIP`), `tour.md`, and the PNGs, writes `so-roadmap.md`, and writes three past daily notes (`scripts/sandbox.ts:39-62,70`).
4. Private XDG folders are created; no `config.toml` is written (`scripts/sandbox.ts:71-74`).
5. so starts on the vault with every remaining argument (`scripts/sandbox.ts:77-88`); argument parsing errors come from so's `parseArgs` (`src/app/main.ts:102-117`).
6. The wrapper forwards `SIGHUP`/`SIGTERM` and exits with so's exit code (`scripts/sandbox.ts:89-92`).

## 6. Boundaries

### In Scope

- A `--profile <name>` option for `bun run sandbox` that selects a named scenario.
- What a profile can define: vault content, `config.toml`, environment, and setup such as a Git repository.
- How profiles are stored, staged, reset, isolated from one another, and listed.
- How a profile maps to the e2e journeys it supports, for manual verification.
- Keeping `bun run sandbox` without `--profile` working as today.
- Checks that keep profiles from silently breaking (for example a profile config that no longer parses).

### Out of Scope

- Product behavior in `src/`; so's own CLI (`src/app/main.ts`) is unchanged.
- Automated e2e tests themselves (`test/e2e`), beyond any check of the sandbox.
- Building or shipping the sandbox in the release binary.
- Git integration and LSP features themselves (PR #10, PR #11).

### Interfaces and Dependencies

- `package.json` `sandbox` script — the entry the user invokes.
- `test/fixtures/**` — shared fixture content; changes to it affect both tests and profiles.
- so's environment contract: `XDG_CONFIG_HOME`, `XDG_STATE_HOME` (absolute paths only), `NO_COLOR`, `SO_LOG`.
- `ConfigSchema` (`src/core/config/schema.ts`) — strict; a profile's `config.toml` depends on the branch's schema.
- Git CLI ≥ 2.31 and the isolated-env pattern from PR #10 for any Git profile.
- `test/fixtures/fake-lsp.ts` and the `[lsp]` config (PR #11 only) for any LSP profile.
- `knip.json` entries and `tsconfig.json` include — any new script or module must fall under them.

## 7. Unknowns

- Which journeys need a profile now: which feature scenarios (default tour, Git repo, Bases edge cases, large vault, LSP, mouse-off, empty vault, broken config) the user wants first.
- Whether profiles are defined in code (TypeScript modules), as data (a folder per profile with a manifest), or a mix.
- Whether each profile gets its own `.sandbox/<profile>/` (vault and XDG), and whether the current `.sandbox/vault` layout must be preserved or may move.
- Whether a profile's vault is restaged on every run (always fresh) or persisted until `--reset` (today's behavior).
- Whether the journeys themselves (steps to perform and what to check) are documented next to each profile, and in what form.
- Whether `--profile` lists available profiles when missing or unknown (for example `--list`).
- Whether a Git or LSP profile should exist on this branch before PR #10 and PR #11 merge, given that `main`'s config schema rejects `[git]` and `[lsp]`.
- Git detection when the vault sits inside this repository: `.sandbox/` is under the so repository and gitignored (`.gitignore:47`), so a profile without its own `git init` runs inside the so repo's working tree; how PR #10's detection treats that ignored path is unverified.
- Whether any profile check should run in `check` or `test:ci`; today no CI job runs `scripts/**/*.test.ts`.
