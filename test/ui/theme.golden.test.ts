import { afterEach, describe, expect, test } from "bun:test";
import { TextAttributes } from "@opentui/core";
import { registerBlockRenderer } from "../../src/core/lang/markdown/live-preview";
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

/** A note whose second link resolves, whose first does not, and whose last embed fails to render. */
const STATES_MD =
  "# States\n\nSee [[nowhere]] and [[plan]].\n\nPlain line.\n\n![[table.broken]]\n";

/** The note open in live view, the cursor on its heading so that line is revealed. */
async function liveStates(
  o: Parameters<typeof mountShell>[0],
): Promise<Mounted> {
  registerBlockRenderer("broken", () => {
    throw new Error("renderer failed");
  });
  const x = await mountShell(o);
  x.store.dispatch({
    type: "indexBatch",
    summaries: [],
    files: ["notes/states.md", "plan.md"],
    done: 0,
    total: 0,
  });
  x.keys("<leader>e");
  x.open("notes/states.md", STATES_MD);
  return x;
}

/** Screen position of the first cell of `text`. */
async function find(
  x: Mounted,
  text: string,
): Promise<{ x: number; y: number }> {
  const lines = (await x.frame()).split("\n");
  const y = lines.findIndex((l) => l.includes(text));
  return { x: [...(lines[y] ?? "")].indexOf(text[0] ?? ""), y };
}

/** Styles of an unresolved link, a resolved link, and the reveal and error signs. */
async function stateStyles(x: Mounted) {
  const at = {
    unresolved: await find(x, "nowhere"),
    resolved: await find(x, "plan."),
    reveal: await find(x, "▕"),
    error: await find(x, "⚠"),
  };
  const spans = x.t.captureSpans().lines;
  return Object.fromEntries(
    Object.entries(at).map(([k, p]) => [k, cellStyle(spans, p.x, p.y)]),
  );
}

describe("live view states", () => {
  test("stay distinguishable without colour at 80×24", async () => {
    m = await liveStates({ cols: 80, rows: 24, color: "nocolor" });
    const lines = (await m.frame()).split("\n");
    const spans = m.t.captureSpans().lines;
    const colours = new Set(
      spans.flatMap((l) => l.spans).flatMap((s) => [s.fg.intent, s.bg.intent]),
    );
    expect([...colours]).toEqual(["default"]);

    const styles = await stateStyles(m);
    expect(styles.unresolved?.attrs).not.toBe(styles.resolved?.attrs);
    expect(styles.unresolved?.attrs).not.toBe(styles.reveal?.attrs);
    expect(lines.filter((l) => l.includes("▕"))).toHaveLength(1);
    expect(lines.find((l) => l.includes("▕"))).toContain("# States");
    expect(lines.find((l) => l.includes("⚠"))).toContain("![[table.broken]]");

    expect(lines[0]?.trim()).toBe("states.md");
    expect(lines[23]).toMatch(/^ NORMAL +│ notes\/states\.md +1:1 $/);
    expect(await m.frame()).toMatchSnapshot();
  });

  test("keep the command line and its message unclipped at 80×24", async () => {
    m = await liveStates({ cols: 80, rows: 24, color: "nocolor" });
    const typed = `:s/${"p".repeat(70)}/r/`;
    expect(typed).toHaveLength(76);
    m.keys(typed);
    expect(await m.cmdline()).toBe(typed);
    m.keys("<Esc><leader>m<leader>m:s/x/y/<CR>");
    expect((await m.message()).trim()).toBe("reading mode — <leader>m to edit");
  });

  test("matches the light theme golden", async () => {
    m = await liveStates({ cols: 80, rows: 24, theme: "light" });
    const styles = await stateStyles(m);
    expect(styles.unresolved).not.toEqual(styles.resolved);
    expect(styles).toMatchSnapshot();
    expect(await m.frame()).toMatchSnapshot();
  });
});
