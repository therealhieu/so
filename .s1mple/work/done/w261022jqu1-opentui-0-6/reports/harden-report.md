# Harden Report

- **Outcome:** `Findings identified`
- **Mode:** `Workflow`
- **Target:** `.s1mple/work/active/w261022jqu1-opentui-0-6` — OpenTUI 0.6.6 upgrade
- **Range:** `80103fb..HEAD`
- **Reviewed:** `package.json`, `src/app/{lifecycle,main,tool-host}.ts` and their tests, `src/core/lang/markdown/renderers/mermaid.ts`, `src/ui/{shell,sized-text,zoom-row}.ts`, `src/ui/widgets/sized-text.ts`, `src/ui/editors/text-view.ts`, `src/ui/cell-width.test.ts`, `src/ui/widgets/sized-text.test.ts`, `test/support/ui.ts`, `test/ui/{git,sized-text,editor-options}.test.ts`, `test/integration/config.test.ts`
- **Not reviewed:** `bun.lock` (generated); `.s1mple/` documents (out of scope by rule)

## Summary

| Category | Major | Minor |
|---|---|---|
| Correctness | 0 | 0 |
| Test Gap | 0 | 0 |
| Redundancy | 0 | 1 |
| Dev Speed | 0 | 0 |
| Workflow Leak | 0 | 0 |
| Principles | 0 | 0 |

The change is sound; the one finding is that startup now decides "no colour" from `NO_COLOR` in two places, which can drift from the theme's own decision.

## Findings

### HRD-1 — Minor — Redundancy — NO_COLOR is read twice in startup

**Evidence**

`src/app/main.ts:333`

```ts
function startsColourless(config: Action | undefined): boolean {
  if ((process.env.NO_COLOR ?? "") !== "") return true;
```

`src/app/main.ts:548`

```ts
const noColor = (process.env.NO_COLOR ?? "") !== "";
```

The renderer's backdrop (`startsColourless`) and the store's `color` field each parse `NO_COLOR` on their own, while `src/ui/theme.ts:352` describes the theme as "the one place colour is decided".

**Consequence:** a later change to how `NO_COLOR` is read (for example, honouring it when set but empty) can update one reading and not the other, so the first frame and the rest of the session disagree about colour.

**Recommendation:** read `NO_COLOR` once before `createRenderer` (one `const noColor`) and use it for both the store's `color` and the backdrop decision (`noColor || color = "never"`).

## Checks

| Command | Result | Duration |
|---|---|---|
| `bun run check` | `Failed` — Biome (1 warning, 2 infos, all in files outside the range and present on master), tsc, and knip clean; 2017 pass, 3 fail, all watcher tests that fail on master on this machine (ship file A10) | 33 |
| Workflow-leak scan (`rg -nP …` over the range's files) | `Passed` — no matches | 1 |
| `bun test --timeout=20000 test/ui/sized-text.test.ts`, `test/ui/git.test.ts`, `test/e2e` | `Passed` — 17, 23, and 34 pass (overall verification, `1fb41e5`) | Not re-timed |

## Limits

- **Unverified areas:** how kitty images and sized glyphs look on a real screen (scripted screenshots capture only the wallpaper; overall verification checked bytes, screen text, and logs).
- **Blockers:** None

## Resolution

Workflow mode only. The implementer fills this section; the sections above stay unchanged.

- **Status:** `Resolved`

| Finding | Change | Verification | Commit | Result |
|---|---|---|---|---|
| `HRD-1` | `src/app/main.ts:main` reads `NO_COLOR` once into `const noColor` before `createRenderer`; `startsColourless(noColor, config)` and the store's `color` both use it | `rg -n "NO_COLOR" src/app/main.ts` → one read (plus the doc comment); `sh .tmp/nocolor-loop.sh <worktree> 10` → `0/10 failed`; `bun test --timeout=20000 test/e2e/restore.test.ts` → 7 pass, 0 fail | `953aa04` | `Fixed` |

- **Final checks:**
  - `bun run check` → Biome (1 warning, 2 infos, all outside the range and present on master), tsc, and knip clean; 2019 pass, 1 fail — a watcher test (`src/workspace/watcher.test.ts`, "dot entries other than .git are reported while dotfiles are shown"), expected on this machine (ship file A10).
  - `bun test --timeout=20000 test/e2e/restore.test.ts` → `Passed` — 7 pass, 0 fail.
  - `sh .tmp/nocolor-loop.sh <worktree> 10` → `Passed` — 0/10 failed.
- **Remaining issues:** None
