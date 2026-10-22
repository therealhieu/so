# W261022JQU1 G1 Verification Report

## Scope

- **Scope:** `G1`
- **Tasks:** `G1-T1`, `G1-T2`
- **Change range:** `01f3d79..6509b76`
- **Report:** `.s1mple/work/active/w261022jqu1-opentui-0-6/reports/g1-verification-report.md`

## Status

`Passed`

G1 meets both assigned rows: OpenTUI is pinned at exactly 0.6.6, the two renderer-less unit tests run on owned buffers, and the Mermaid shim is gone with Mermaid still laying out under a live renderer. tsc is clean, and `bun run check` fails only on local watcher tests (`A10`).

## Coverage

| REQ | UDES or DES | V | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1` | `DES1` | `V1` | `package.json:22` `"@opentui/core": "0.6.6"`; `bun.lock` root dependency and all nine `@opentui/core*` entries at `0.6.6` with new integrity hashes; installed `node_modules/@opentui/core/package.json` version `0.6.6` after `bun install --frozen-lockfile` (no changes) | `Met` |
| `REQ1` | `DES1` | `V1` | `src/ui/cell-width.test.ts:23-27` and `src/ui/widgets/sized-text.test.ts:13-20`: `new ResourceContext({ objectCapacity: 16, renderCellsMax: … })` in `beforeEach`, `owner.destroy()` in `afterEach`; buffers made with `{ owner }` (`cell-width.test.ts:41,56`, `sized-text.test.ts:28`) and destroyed in `finally` before the owner; cells read through `buf.withBuffers` (`cell-width.test.ts:61`, `sized-text.test.ts:47`) | `Met` |
| `REQ4` | `DES8` | `V1` | `src/core/lang/markdown/renderers/mermaid.ts:229` `const drawn = mermaid().renderMermaidSVG(p.source, colors);`; `withoutWindow` and its comment removed; `rg withoutWindow src test` finds nothing | `Met` |

## Checks

| Check | Command or method | Actual result | Result |
|---|---|---|---|
| Group check: tsc | `bun --bun run tsc --noEmit -p .` | exit 0 | `Passed` |
| `G1-T1` check | `bun test src/ui/cell-width.test.ts src/ui/widgets/sized-text.test.ts` | 4 pass, 0 fail, 20 expect() calls | `Passed` |
| `G1-T2` check | `bun test src/core/lang/markdown` | 155 pass, 0 fail, 18 snapshots | `Passed` |
| `DES8` premise | `rg 'globalThis\.window\|global\.window' node_modules/@opentui/core --glob '*.js'` | no match; the only `window` assignments are an instance field (`this.window`) in the bundled chunks | `Passed` |
| `DES8` under a renderer | Temporary probe test (deleted after the run): `createTestRenderer`, then `"window" in globalThis` and `mermaidSvg` for a sequence diagram and a flowchart | `"window" in globalThis` is `false` with a live renderer; both diagrams return SVG results | `Passed` |
| `DES8` in the app | `bun test --timeout=20000 test/ui/live-preview.test.ts` (Mermaid flowchart preview and "wider than" fallback on a mounted renderer) | 20 pass, 0 fail | `Passed` |
| `V1` / group check | `bun run check` | Biome clean (1 warning, 2 infos in untouched files `src/ui/catppuccin.test.ts`, `src/ui/warm-light.test.ts`, `src/ui/theme.test.ts`), tsc clean, knip clean; 2015 pass, 4 fail of 2019 — all four in `src/workspace/watcher.test.ts` (3) and `src/workspace/git-watcher.test.ts` (1), the local watcher failures accepted by `A10` | `Passed` |

## Integration

Not applicable — group scope

## Findings

None

## Test Coverage

- **Covered:** The owned-buffer path is exercised by the two existing unit tests (width measurement for ASCII, CJK, Hangul, and emoji clusters; wide-character clipping; sized-heading painting). Mermaid layout without the shim is covered by `src/core/lang/markdown/renderers/mermaid.test.ts` and by `test/ui/live-preview.test.ts`, which renders a Mermaid flowchart with a renderer mounted — the exact condition the shim guarded.
- **Missing:** None for G1. No test asserts the absence of a global `window`; the live-preview Mermaid cases fail if a renderer reintroduces one, so a dedicated test would be redundant.
- **Low-value:** None

## Scope Changes

None. The diff touches exactly the four planned `G1-T1` files and the one `G1-T2` file.

## Blockers and Unverified Items

- `A10` expected five local watcher failures; this run saw four. The count varies run to run on this machine, and every failure is in a watcher suite, so the accept rule holds.
- Out of G1 scope, for `G4`: `test/ui/editor-options.test.ts:100` reads `m.t.renderer.currentRenderBuffer.buffers` directly, and on 0.6.6 the case "a line of wide characters wraps at the window edge and places the cursor by cells" fails with `Use withBuffers() for Context-owned framebuffer access`. The buffer is renderer-owned, not one a test makes without a renderer, so `DES1`'s G1 file list does not cover it; it belongs to the full-suite sweep in `G4-T1`, and the same `withBuffers` read fixes it.
