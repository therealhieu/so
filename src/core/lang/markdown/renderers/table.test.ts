import { beforeEach, expect, test } from "bun:test";
import {
  layoutNote,
  noteView,
  rowText,
} from "../../../../../test/support/markdown";
import type { RenderLine, Span } from "../../../kernel/view/types";
import { displayWidth } from "../../../kernel/view/wrap";
import { registerBlockRenderer } from "../live-preview";
import { tableRenderer } from "./table";

beforeEach(() => registerBlockRenderer("table", tableRenderer));

const ROUTES = [
  "Intro",
  "",
  "| Source item | Covered by parts | Expected outcome |",
  "|---|---|---|",
  "| Sign in → session, token | 1, 3 | A valid password creates a session and a refresh token that expires after thirty days |",
  "| Sign out → none | 2, 3 | The session and every refresh token issued for it are revoked at once |",
  "",
].join("\n");

const textOf = (spans: Span[]) => spans.map((s) => s.text).join("");

/** Every screen row a layout draws, widget rows included. */
const screen = (rows: RenderLine[]): string[] =>
  rows.flatMap((r) =>
    r.widget?.type === "text"
      ? (r.widget.data as Span[][]).map(textOf)
      : [rowText(r)],
  );

const layout = (text: string, width: number) =>
  layoutNote(noteView(text, { width, cursor: { line: 0, col: 0 } }), "reading");

test("a table that fits keeps one row per source line", () => {
  const rows = layout(
    "| Key | Action |\n|:---|---:|\n| `gd` | Follow link |\n",
    80,
  );
  expect(rows.some((r) => r.widget !== undefined)).toBe(false);
  expect(rows.slice(0, 3).map(rowText)).toEqual([
    "│ Key │      Action │",
    "├─────┼─────────────┤",
    "│ gd  │ Follow link │",
  ]);
});

test("a wide table wraps its cells to fit the window", () => {
  const rows = screen(layout(ROUTES, 64)).slice(2, -1);
  expect(rows).toEqual([
    "│ Source     │ Covered │ Expected outcome                     │",
    "│ item       │ by      │                                      │",
    "│            │ parts   │                                      │",
    "├────────────┼─────────┼──────────────────────────────────────┤",
    "│ Sign in →  │ 1, 3    │ A valid password creates a session   │",
    "│ session,   │         │ and a refresh token that expires     │",
    "│ token      │         │ after thirty days                    │",
    "├────────────┼─────────┼──────────────────────────────────────┤",
    "│ Sign out   │ 2, 3    │ The session and every refresh token  │",
    "│ → none     │         │ issued for it are revoked at once    │",
  ]);
  for (const row of rows) expect(displayWidth(row, 1)).toBeLessThanOrEqual(64);
});

test("a source line drawn on several rows is one text widget", () => {
  const rows = layout(ROUTES, 64);
  const header = rows.find((r) => r.sourceLine === 2);
  expect(header?.spans).toEqual([]);
  expect(header?.widget?.type).toBe("text");
  expect(header?.widget?.rows).toBe(3);
  const rule = rows.find((r) => r.sourceLine === 3);
  expect(rule?.widget).toBeUndefined();
});

test("wrapped cells keep their column's alignment", () => {
  const rows = screen(
    layout(
      "| Name | Total |\n|---|---:|\n| alpha beta gamma delta epsilon zeta | 12 345 678 901 234 |\n",
      40,
    ),
  );
  const body = rows.slice(2).filter((r) => r.startsWith("│"));
  const totals = body.map((r) => r.split("│")[2] ?? "");
  expect(totals.every((t) => t.endsWith(" ") && !t.endsWith("  "))).toBe(true);
});

test("a word longer than its column splits across rows", () => {
  const rows = screen(
    layout(
      "| A | B |\n|---|---|\n| an-identifier-with-no-spaces-at-all | short words here |\n",
      30,
    ),
  );
  for (const row of rows) expect(displayWidth(row, 1)).toBeLessThanOrEqual(30);
  expect(rows.join("")).toContain("an-ident");
});

test("a table with too many columns for the width shows records", () => {
  const rows = layout(
    [
      "| Benchmark | Notes | p50 | p95 | p99 | Budget | Status |",
      "|---|---|--:|--:|--:|--:|---|",
      "| open vault | first frame | 41 ms | 58 ms | 73 ms | 120 ms | pass |",
      "| search | full text | 6 ms | 9 ms | 14 ms | 20 ms | pass |",
      "",
    ].join("\n"),
    60,
  );
  expect(rows.some((r) => r.sourceLine === 0 || r.sourceLine === 1)).toBe(
    false,
  );
  expect(screen(rows).slice(0, 9)).toEqual([
    "▌ Benchmark: open vault",
    "▌ Notes: first frame",
    "▌ p50: 41 ms",
    "▌ p95: 58 ms",
    "▌ p99: 73 ms",
    "▌ Budget: 120 ms",
    "▌ Status: pass",
    "",
    "▌ Benchmark: search",
  ]);
  const first = rows.find((r) => r.sourceLine === 2);
  const record = (first?.widget?.data as Span[][] | undefined)?.[0];
  expect(record?.map((s) => s.style)).toEqual(["mdMarker", "mdBold", "text"]);
});

test("narrow columns keep a squeezed table a grid", () => {
  const rows = screen(
    layout(
      [
        "| Step | A | B | C | D | E | F |",
        "|---|---|---|---|---|---|---|",
        "| a long description that has to wrap inside its column | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |",
        "",
      ].join("\n"),
      60,
    ),
  ).filter((r) => r !== "");
  expect(rows.every((r) => /^[│├]/.test(r))).toBe(true);
  for (const row of rows) expect(displayWidth(row, 1)).toBeLessThanOrEqual(60);
});

test("wide characters take two cells and keep the borders aligned", () => {
  const rows = screen(
    layout("| 名前 | Note |\n|---|---|\n| 東京 | a |\n| x | b |\n", 80),
  );
  const widths = rows.slice(0, 4).map((r) => displayWidth(r, 1));
  expect(new Set(widths).size).toBe(1);
});

test("the same table lays out again at another width", () => {
  const wide = screen(layout(ROUTES, 200));
  const narrow = screen(layout(ROUTES, 64));
  expect(wide).not.toEqual(narrow);
  expect(wide[2]).toContain("│ Covered by parts │");
});
