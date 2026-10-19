# W26101928X8 G1 Verification Report

## Scope

- **Scope:** `G1`
- **Tasks:** `G1-T1`, `G1-T2`, `G1-T3`, `G1-T4`
- **Change range:** `407ac50..13742f3`
- **Report:** `.s1mple/work/active/w26101928x8-kitty-text-sizing/reports/g1-verification-report.md`

## Status

`Failed`

G1 is correct for ATX headings, scripts, and the switch, and every check passes. Two requirement gaps remain, both `Minor`: a revealed heading whose source wraps moves the lines below it (`REQ4`), and setext H1/H2 headings are never sized (`REQ1`).

## Coverage

| REQ | UDES or DES | V | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1` (core layout) | `DES2` | `V1` | `src/core/kernel/view/sized.ts:wrapSized`, `src/core/lang/markdown/renderers/heading.ts:sizedLine`, `src/core/kernel/view/text-view.ts:layoutLine` (exported), `src/core/kernel/view/types.ts:SizedBlock/SizedChunk` | `Not met` — ATX H1/H2 are sized correctly; setext H1/H2 are not (`G1-VER2`) |
| `REQ2` (core fallback) | `DES1`, `DES2`, `DES4` | `V1`, `V3` | `src/core/state/markdown-view.ts:65` `sizedText: host.sizedText && sizedText`; `heading.ts` returns `out` unchanged when `!input.ctx.sizedText`; `math.ts:mathTextSpans` and `inline.ts:footnoteRef` fall back to today's output; `ViewHost.sizedText: false` in `src/ui/editors/text-view.ts:840`, `base-view.ts:93` | `Met` |
| `REQ4` | `DES3` | `V2` | `src/core/lang/markdown/live-preview.ts:keepSizedRows` | `Not met` — holds only when the revealed source fits one row (`G1-VER1`) |
| `REQ5` (core spans) | `DES4` | `V3` | `types.ts:Span.script`, `sized.ts:scriptSpans`, `math.ts:mathRuns/mathSpans/mathTextSpans`, math block cache key `` `${block.hash}|${ctx.sizedText}` ``, `inline.ts:footnoteRef`, `renderers/footnote.ts` | `Met` |
| `REQ6` | `DES1` | `V8` | `src/core/config/schema.ts:117` `sizedText: z.boolean().default(true)`, `src/core/state/settings.ts` `SETTINGS` entry `["preview","sizedText"]` | `Met` |

## Checks

| Check | Command or method | Actual result | Result |
|---|---|---|---|
| `V1` | `bun test src/core/lang/markdown/renderers/heading.test.ts src/core/kernel/view/sized.test.ts` | 8 pass, 0 fail. `# Raft` → one `sizedText` widget, `rows: 2`, chunk cells 12; `# Leader leases` → `rows: 4` at width 20; `## Guarantees` chunks 6 cells each, widest row ≤ 20; bold run its own chunk with `under`; H3 and `sizedText: false` equal today's decorations | `Passed` |
| `V2` | `bun test src/core/lang/markdown/live-preview.test.ts` | 34 pass, 0 fail. Screen rows equal with the cursor on and off `# Raft`; revealed line shows `# Raft` plus one blank `text` widget row | `Passed` |
| `V3` | `bun test src/core/lang/markdown/renderers/math.test.ts src/core/lang/markdown/live-preview.test.ts` | 40 pass, 0 fail. `mathRuns("Q_{w} + Q_{r} > N")` runs, `T_{timeout}` → `ti`,`me`,`ou`,`t`, `x^{a_b}` → sup `ab`, `[^note]` → `no`,`te`; off path re-rendered from the same block hash gives `Tₜᵢₘₑₒᵤₜ` (cache key holds) | `Passed` |
| `V8` | `bun test src/core/state/settings.test.ts` | 16 pass, 0 fail. Default `true`; Enter emits `writeSetting` for `["preview","sizedText"]`, `false`, previous `true` | `Passed` |
| `bun run check` | `bun run check` | Biome: 1 warning, 2 infos, all in `src/ui/theme.test.ts` (pre-existing, unchanged by this range); tsc and knip clean; 1984 pass, 0 fail across 185 files | `Passed` |
| Width bound and wide characters | Scratch probe (outside the repo) calling `wrapSized` | `中文标题和更多` at 2×, width 20 → rows of 20 and 8 cells; at 1.5×, width 20 → 18 and 10; `ab中cd` at 1.5× → chunk `ab中` 6 cells; `x😀y` at 2×, width 9 → 8 cells. Every chunk at 1.5× has an even cell count and no row exceeds the width | `Passed` |
| Revealed wrapped heading | Scratch probe: `layoutNote` of `Intro\n\n# Consensus guarantees for distributed leaders\n\nBody`, width 30, `live` | Cursor off: `sizedText` widget, 8 rows. Cursor on: source line (46 cells → 2 wrap rows at width 30) plus a `text` widget of 7 rows = 9 screen rows | `Failed` (`G1-VER1`) |
| Setext heading | Scratch probe: `Intro\n\nRaft\n====\n\nBody`, width 30, `sizedText: true` | Row `█ Raft` at normal size; no `sizedText` widget | `Failed` (`G1-VER2`) |
| Project standards | `git diff 407ac50..13742f3 -- src test` scanned for work-process IDs; imports of `sized.ts` | No work, requirement, design, task, or verification IDs in code. `sized.ts` imports only `../text/cells` and `./types`; `src/core` stays pure | `Passed` |

## Integration

Not applicable — group scope.

The G2 contracts are sufficient for the writer: each `SizedChunk` carries `text`, `style`, `under` (set for marked runs such as `mdBold` and `mdCode` over `mdHeading2`), and `cells` (`w = cells / 2` for the 1.5× `OSC 66` field); `SizedBlock.scale` selects `s=2` or `s=2:n=3:d=4`; `Span.script` carries `text` (1–2 characters) and `place`. Inserted spans inside a heading (wiki-link text, Unicode math, footnote labels) have no `under`, exactly as `layoutLine` lays them out today, so the writer must fall back to the block's heading style for their background.

## Findings

### G1-VER1 — Minor — Correctness — A revealed heading whose source wraps moves the lines below

- **Builds:** `REQ4`, `DES3`, `V2`, `G1-T3`
- **Evidence:** `src/core/lang/markdown/live-preview.ts:109` `const blank = d.widget.rows - 1;` assumes the revealed source takes one row. Probe at width 30 with a 46-cell H1: sized block 8 rows, revealed source 2 wrap rows + 7 blank rows = 9, so `Body` moves down one row when the cursor enters the heading. The implementer listed this as a remaining issue.
- **Impact:** `REQ4` says a revealed heading keeps its rows and `DES3` says the lines below never jump. Any H1/H2 longer than the window's text width (common in narrow splits) shifts the screen by `sourceRows − 1` rows on cursor entry and exit.
- **Resolution:** Size the spacer as the sized rows minus the source line's wrapped rows at `v.width` (the kernel already has `wrapLine` in `src/core/kernel/view/wrap.ts`), never below zero. Add one case to the `V2` test with a heading whose source wraps.
- **Proof to close:** `bun test src/core/lang/markdown/live-preview.test.ts` with a wrapped-source heading whose total screen rows are equal with the cursor on and off it; `bun run check`.

### G1-VER2 — Minor — Requirement gap — Setext H1 and H2 headings are never sized

- **Builds:** `REQ1`, `DES2`, `V1`, `G1-T2`
- **Evidence:** `src/core/lang/markdown/renderers/heading.ts:53-59` returns the setext decorations before the `SCALES` branch, so `Raft\n====` renders `█ Raft` at normal size with `sizedText: true` (probe). The implementer recorded this as a deviation; the ship file's Decisions do not exclude setext headings, and `REQ1` and the Goal say every H1 shows at 2× and every H2 at 1.5×.
- **Impact:** In kitty a note mixing `# Title` and `Title\n=====` shows one heading large and the other at normal size. No breakage: the setext heading falls back to today's look.
- **Resolution:** Size setext H1/H2 too: one block `replace` from the text line through the underline with the `sizedText` widget, and a reveal spacer that subtracts every revealed source row (text and underline). Otherwise the user must approve setext as an exclusion in the ship file.
- **Proof to close:** A `V1` case in `src/core/lang/markdown/renderers/heading.test.ts` where `Raft\n====` yields one `sizedText` widget at scale 2, and a `V2` case where its reveal keeps the screen rows; `bun run check`.

## Test Coverage

- **Covered:** sized chunking and wrapping at both scales, including mid-word breaks, the width bound, and styled runs (`sized.test.ts`); the heading widget contract and the unchanged H3 and off paths (`heading.test.ts`); the one-row reveal spacer and inline math and footnote pairs with their off path (`live-preview.test.ts`); `mathRuns` and math block pairs with the cache key re-render (`math.test.ts`); the setting default and picker effect (`settings.test.ts`).
- **Missing:** a revealed heading whose source wraps (`G1-VER1`); setext headings (`G1-VER2`); a wide character in `wrapSized` (probe passes, no test); the fallback when a math script or footnote label holds a wide character (`DES4`'s rule, no test); `PreviewCtx.sizedText` with `host.sizedText` true and `preview.sizedText` false (one line, `markdown-view.ts:65`; `V6` in G2 covers only the host-off side).
- **Low-value:** None.

## Scope Changes

- **Scripts inside a sized heading keep Unicode form** (`heading.ts:69-71`). Accepted: `DES2`'s approved `SizedChunk` draws a chunk at one scale and has no script field, so half-size scripts inside a 2× chunk are outside the approved contract. As a result, `# Quorum $Q_{w}$` still shows `Q_{w}` as source inside the heading.
- **Note embeds never size text** (`renderers/embed.ts:104`). Accepted: embeds are a stated non-goal.
- **Setext headings stay normal size.** Not accepted; see `G1-VER2`.
- **Wrapped revealed source exceeds the sized height.** Not accepted; see `G1-VER1`.
- **Existing test edits:** besides the settings list line, `src/core/config/toml.test.ts` and `src/core/state/config.test.ts` gained `sizedText: true` in their default `preview` objects, and four test hosts gained `sizedText: false`. These follow from the new schema default and `ViewHost` field and are acceptable.
- **`project.md` settings count** (twelve → thirteen) is left for Deliver, as the ship file plans.

## Blockers and Unverified Items

None. Kitty output and the UI writer are G2 scope and were not checked here.
