# TypeScript

## Applies To

- **Paths:** All TypeScript sources (`**/*.ts`, `**/*.tsx`) from the repository root, excluding dependencies and generated output. `tsconfig.json` checks `src`, `test`, and `scripts`.
- **Component Differences:** `src/core` must stay pure (no I/O, runtime, or `@opentui/*` imports); see the import rules in [project context](../project.md#boundaries-and-dependencies).

## Toolchain and Configuration

| Tool | Version | Configuration |
|---|---|---|
| TypeScript | `7.0.2` | `tsconfig.json` |
| Bun (runtime, test runner) | `1.4.2` | `package.json` `packageManager`, `bunfig.toml` |
| `@types/bun` | `1.4.2` | `tsconfig.json` `types: ["bun"]` |
| Biome (format + lint) | `2.5.15` | `biome.json` |
| knip | `6.39.0` | `knip.json` |

`tsconfig.json` rules:

| Option | Value | Reason |
|---|---|---|
| `strict` | `true` | Full strict checking |
| `noEmit` | `true` | Bun runs `.ts` directly; `tsc` only type-checks |
| `target` / `module` / `moduleResolution` | `ESNext` / `Preserve` / `bundler` | Match Bun's ESM resolution |
| `verbatimModuleSyntax` | `true` | Type-only imports must use `import type` |
| `noUncheckedIndexedAccess` | `true` | Index access yields `T \| undefined` |
| `exactOptionalPropertyTypes` | `true` | `prop?: T` does not accept an explicit `undefined` |
| `skipLibCheck` | `true` | TS 7 reports TS2416 inside OpenTUI's `KeyHandler.d.ts`; project sources are still fully checked |

- Run the type checker through Bun, so no Node is needed: `bun --bun run tsc --noEmit -p .`
- Biome uses its recommended lint rules and formatter defaults with space indentation. It skips `.s1mple`, `dist`, `test/vim/expected.json`, and `test/fixtures/boundary-violation`.
- knip entries are `src/app/main.ts`, `scripts/*.ts`, and `test/**/*.ts` (minus the boundary-violation fixtures); the project is `src/**/*.ts`.
- Add dependencies with `bun add <pkg>`; `bunfig.toml` writes exact versions.

## Coding Conventions

- Keep it lean and simple: no abstractions beyond current needs.
- Name things in domain terms. Do not put work-process identifiers (work, requirement, design, phase, goal, task, or verification IDs) in comments, identifiers, test names, or log messages.

## Types and Public Interfaces

- Use `import type` for type-only imports (`verbatimModuleSyntax`).

## Error Handling

- Not established.

## Testing and Verification

- Use `bun test` (`import { expect, test } from "bun:test"`).
- Colocate unit tests as `*.test.ts` next to the source in `src/`; repository-level suites live in `test/`.
- Name tests by behavior, e.g. `test("exact npm pins")`.
- Run `bun run check` before committing: `biome check .`, `tsc`, `knip`, and the unit suites.

## Examples

Not needed.

## Sources and Open Questions

- **Sources:** `tsconfig.json`, `biome.json`, `knip.json`, `package.json`; `.s1mple/S1MPLE.md` Implementation.
- **Open Questions:** None.
