# Harden Report

- **Outcome:** `Findings identified`
- **Mode:** `Workflow`
- **Target:** `.s1mple/work/active/w26101928x8-kitty-text-sizing/` (W26101928X8 Kitty text sizing)
- **Range:** `53fadeb..HEAD`
- **Reviewed:** `src/ui/sized-text.ts`, `src/ui/widgets/sized-text.ts`, `src/ui/shell.ts`, `src/ui/editors/text-view.ts`, `src/ui/widgets/embed.ts`, `src/app/main.ts`, `src/core/kernel/view/{sized,types,text-view}.ts`, `src/core/lang/markdown/{live-preview,inline}.ts`, `src/core/lang/markdown/renderers/{heading,footnote,math,embed}.ts`, `src/core/state/{markdown-view,view-context,settings}.ts`, `src/core/config/schema.ts`, and the new tests (`src/core/kernel/view/sized.test.ts`, `renderers/heading.test.ts`, `src/ui/sized-text.test.ts`, `test/ui/sized-text.test.ts`, `test/e2e/sized-text.test.ts`).
- **Not reviewed:** `.s1mple/` documents (excluded by the skill); the settings-picker snapshot (generated).

## Summary

| Category | Major | Minor |
|---|---|---|
| Correctness | 0 | 0 |
| Test Gap | 0 | 0 |
| Redundancy | 0 | 1 |
| Dev Speed | 0 | 0 |
| Workflow Leak | 0 | 0 |
| Principles | 0 | 0 |

The change is sound: the writer follows kitty's overwrite rules, including the pre-frame erase, and the sized path stays out of every surface that has sizing off. The one finding is duplicated footnote-label logic that now has to change in two places.

## Findings

### HRD-1 — Minor — Redundancy — Footnote labels are built twice

**Evidence**

`src/core/lang/markdown/renderers/footnote.ts:22`

```ts
const pairs = ctx.sizedText
  ? scriptSpans(label, "sup", "mdFootnote")
  : undefined;
…
const shown = /^\d+$/.test(label)
  ? [...label].map((d) => SUPERSCRIPT[Number(d)]).join("")
  : `[${label}]`;
```

`src/core/lang/markdown/inline.ts:56`

```ts
const footnoteLabel = (label: string) =>
  /^\d+$/.test(label)
    ? [...label].map((d) => SUPERSCRIPT[Number(d)]).join("")
    : `[${label}]`;

const footnoteRef = (label: string, sizedText: boolean): Span[] =>
  (sizedText ? scriptSpans(label, "sup", "mdFootnote") : undefined) ?? [
    { text: footnoteLabel(label), style: "mdFootnote" },
  ];
```

Both files hold their own `SUPERSCRIPT` table and digit-or-bracket rule, and this change added the same sized branch to each. A reference `[^1]` and its definition `[^1]:` must always show the same label.

**Consequence:** a later change to how labels look (a new fallback, a style, the wide-character rule) has to be made twice, and a miss makes a reference and its definition disagree.

**Recommendation:** export `footnoteRef` (with `footnoteLabel` and the table) from one place, for example `inline.ts`, and have `footnoteRenderer` use it for the label spans followed by a space; delete the copy in `footnote.ts`. Existing footnote tests in `live-preview.test.ts` keep both paths covered.

## Checks

| Command | Result | Duration |
|---|---|---|
| `bun run check` | `Passed` — Biome, tsc, knip clean; unit suites pass | ~60 |
| Workflow-leak scan (`rg -nP …` over `src` and `test`) | `Passed` — hits only in files this change does not touch (`highlight.test.ts` sample text, `.s1mple` folder names in fs/explorer tests); none in the changed files | <1 |
| `wrapSized` timing (temporary script, removed): 80 / 300 / 1000 / 3000-character H2 at width 100 | `Passed` — 0.22 / 0.21 / 1.01 / 2.07 ms per call; cost grows linearly because each fit check covers one row | ~1 |

## Limits

- **Unverified areas:** the Linux write path (`writeOut` falls back to the stdout writer without a render thread) was reviewed in code only; the macOS path was confirmed live in kitty.
- **Blockers:** None

## Resolution

Workflow mode only. The implementer fills this section; the sections above stay unchanged.

- **Status:** `Not required` | `Completed` | `Blocked`

| Finding | Change | Verification | Commit | Result |
|---|---|---|---|---|
| `HRD-1` | `<path>:<symbol>` | `<command and actual result>` | `<SHA>` or `No change — <reason and evidence>` | `Fixed` / `Blocked` |

- **Final checks:** `<command>` → `Passed` / `Failed` — <actual result>
- **Remaining issues:** <items or None>
