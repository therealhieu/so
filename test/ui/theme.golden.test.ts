import { afterEach, describe, expect, test } from "bun:test";
import { TextAttributes } from "@opentui/core";
import { FILES, indexFixture } from "../support/notes";
import { cellStyle, type Mounted, mountShell } from "../support/ui";

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

/** The files picker over the fixture with its second row selected. */
async function pickerOpen(
  o: Parameters<typeof mountShell>[0],
): Promise<Mounted> {
  const x = await mountShell(o);
  indexFixture(x);
  x.advance(3000);
  x.keys("<leader>e");
  x.open("notes/plan.md", FILES["notes/plan.md"] ?? "");
  x.keys("<leader>ff<C-n>");
  return x;
}

/** Screen position of the selection marker. */
async function marker(x: Mounted): Promise<{ x: number; y: number }> {
  const lines = (await x.frame()).split("\n");
  const y = lines.findIndex((l) => l.includes("▸ "));
  return { x: [...(lines[y] ?? "")].indexOf("▸"), y };
}

describe("picker selection", () => {
  test("stays visible without colour: marker and reverse video", async () => {
    m = await pickerOpen({ cols: 120, rows: 36, color: "nocolor" });
    const at = await marker(m);
    expect(at.y).toBeGreaterThan(0);
    const spans = m.t.captureSpans().lines;
    const colours = new Set(
      spans.flatMap((l) => l.spans).flatMap((s) => [s.fg.intent, s.bg.intent]),
    );
    expect([...colours]).toEqual(["default"]);
    const selected = cellStyle(spans, at.x + 2, at.y);
    expect((selected?.attrs ?? 0) & TextAttributes.INVERSE).toBe(
      TextAttributes.INVERSE,
    );
    const other = cellStyle(spans, at.x + 2, at.y - 1);
    expect((other?.attrs ?? 0) & TextAttributes.INVERSE).toBe(0);
    expect(await m.frame()).toMatchSnapshot();
  });

  test("matches the light theme golden", async () => {
    m = await pickerOpen({ cols: 120, rows: 36, theme: "light" });
    const at = await marker(m);
    const spans = m.t.captureSpans().lines;
    expect({
      selected: cellStyle(spans, at.x + 2, at.y),
      row: cellStyle(spans, at.x + 2, at.y - 1),
    }).toMatchSnapshot();
    expect(await m.frame()).toMatchSnapshot();
  });

  test("keeps its title and counter unclipped at 80×24", async () => {
    m = await pickerOpen({ cols: 80, rows: 24 });
    const lines = (await m.frame()).split("\n");
    const top = lines.find((l) => l.includes("╭─ Find files ─"));
    expect(top).toBeDefined();
    const query = lines.find((l) => l.includes("│ ❯ "));
    expect(query).toMatch(/│ ❯ +18\/18 │/);
    expect(await m.frame()).toMatchSnapshot();
  });
});
