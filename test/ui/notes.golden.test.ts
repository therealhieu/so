import { afterEach, describe, expect, test } from "bun:test";
import { TextAttributes } from "@opentui/core";
import { splitKeys } from "../../src/core/kernel/vim/keys";
import { textFile } from "../support/state";
import { cellStyle, type Mounted, mountShell } from "../support/ui";

/** Saturday 2026-10-03 09:05 in the local time zone. */
const NOW = new Date(2026, 9, 3, 9, 5).getTime();
const MEETING =
  "---\ntags: [meeting]\n---\n## {{title}} · {{date:ddd, MMM Do}}\n- [ ] \n";

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

/** Keys at the fixed clock, so the calendar and expansions use 2026-10-03. */
const press = (x: Mounted, seq: string) => {
  for (const key of splitKeys(seq))
    x.store.dispatch({ type: "key", key, now: NOW });
};

/** A note open with the daily notes of 10-01 and 10-02 and two templates indexed. */
async function notesShell(
  o: Parameters<typeof mountShell>[0],
): Promise<Mounted> {
  const x = await mountShell(o);
  x.store.dispatch({
    type: "indexBatch",
    summaries: [],
    files: [
      "daily/2026-10-01.md",
      "daily/2026-10-02.md",
      "templates/daily.md",
      "templates/meeting.md",
    ],
    done: 0,
    total: 0,
  });
  x.store.dispatch({ type: "indexReady" });
  x.advance(3000);
  x.keys("<leader>e");
  x.open("notes/standup.md", "# Standup\n");
  return x;
}

/** Screen cell of the first occurrence of `text`. */
async function find(x: Mounted, text: string) {
  const lines = (await x.frame()).split("\n");
  const y = lines.findIndex((l) => l.includes(text));
  const line = lines[y] ?? "";
  return { x: [...line.slice(0, line.indexOf(text))].length, y };
}

const variants = [
  { name: "colour", o: { cols: 80, rows: 24 } },
  { name: "NO_COLOR", o: { cols: 80, rows: 24, color: "nocolor" as const } },
  { name: "light", o: { cols: 80, rows: 24, theme: "light" as const } },
];

describe("calendar", () => {
  for (const v of variants)
    test(`matches the ${v.name} golden with a marked day selected`, async () => {
      m = await notesShell(v.o);
      press(m, " nphh");
      const frame = await m.frame();
      expect(frame).toContain("‹ October 2026 ›");
      expect(frame).toContain("[ 1•]");
      const c = m.t.renderer.getCursorState();
      const day = await find(m, "[ 1•]");
      expect({ x: c.x - 1, y: c.y - 1 }).toEqual({ x: day.x + 1, y: day.y });
      expect(frame).toMatchSnapshot();
    });

  test("marked days and today stay distinguishable without colour", async () => {
    m = await notesShell({ cols: 80, rows: 24, color: "nocolor" });
    press(m, " nph");
    const frame = await m.frame();
    const spans = m.t.captureSpans().lines;
    const colours = new Set(
      spans.flatMap((l) => l.spans).flatMap((s) => [s.fg.intent, s.bg.intent]),
    );
    expect([...colours]).toEqual(["default"]);
    expect(frame).toContain(" 1•");
    const today = await find(m, " 3 ");
    const selected = await find(m, "[ 2•]");
    const style = (p: { x: number; y: number }) =>
      cellStyle(spans, p.x, p.y)?.attrs ?? 0;
    expect(
      style({ x: today.x + 1, y: today.y }) & TextAttributes.UNDERLINE,
    ).toBe(TextAttributes.UNDERLINE);
    expect(
      style({ x: selected.x + 2, y: selected.y }) & TextAttributes.INVERSE,
    ).toBe(TextAttributes.INVERSE);
  });
});

/** The template picker over `notes/standup.md` with meeting.md selected and loaded. */
async function templatePicker(cols: number): Promise<Mounted> {
  const x = await notesShell({ cols, rows: 24 });
  press(x, " nt<C-n>");
  const read = [...x.effects].reverse().find((e) => e.kind === "readPreview");
  if (read?.kind !== "readPreview") throw new Error("no preview read");
  x.store.dispatch({
    type: "previewLoaded",
    id: read.id,
    path: read.path,
    result: textFile(MEETING),
  });
  return x;
}

describe("template picker", () => {
  test("shows source then the expansion at 120 columns", async () => {
    m = await templatePicker(120);
    const frame = await m.frame();
    expect(frame).toContain("## {{title}} · {{date:ddd, MMM Do}}");
    expect(frame).toContain("▸");
    expect(frame).toContain("## standup · Sat, Oct 3rd");
    expect(frame).toMatchSnapshot();
  });

  test("hides the preview at 90 columns until Tab", async () => {
    m = await templatePicker(90);
    const before = await m.frame();
    expect(before).not.toContain("## standup");
    expect(before).toContain("Tab preview");
    expect(before).toMatchSnapshot();
    press(m, "<Tab>");
    const after = await m.frame();
    expect(after).toContain("## standup · Sat, Oct 3rd");
    expect(after).toMatchSnapshot();
  });
});

describe("empty template picker", () => {
  test("names the folder and says how to add a template", async () => {
    m = await mountShell({ cols: 80, rows: 24 });
    m.store.dispatch({ type: "indexReady" });
    m.open("notes/standup.md", "# Standup\n");
    press(m, " nt");
    const frame = await m.frame();
    const rows = frame.split("\n");
    const y = rows.findIndex((l) => l.includes("No templates in templates/"));
    expect(y).toBeGreaterThan(0);
    expect(rows[y + 1]).toContain("Create a .md file there to add one");
  });
});

describe("new note prompt", () => {
  test("previews the note's path for a valid title", async () => {
    m = await notesShell({ cols: 80, rows: 24 });
    press(m, " nna/b");
    const frame = await m.frame();
    expect(frame).toContain("New note");
    expect(frame).toContain("❯ a/b");
    expect(frame).toContain("→ a/b.md");
    expect(frame).toContain("⏎ choose a template · esc cancel");
  });

  test("shows why an invalid title is refused instead of a path", async () => {
    m = await notesShell({ cols: 80, rows: 24 });
    press(m, " nn../x");
    const frame = await m.frame();
    expect(frame).toContain("✗ outside the workspace");
    expect(frame).not.toContain("→");
    const lines = frame.split("\n");
    const y = lines.findIndex((l) => l.includes("✗ outside the workspace"));
    const x = [...(lines[y] ?? "")].indexOf("✗");
    const reason = cellStyle(m.t.captureSpans().lines, x, y);
    const p = await find(m, "❯ ../x");
    const field = cellStyle(m.t.captureSpans().lines, p.x, p.y);
    expect(reason?.fg).not.toEqual(field?.fg);
  });
});
