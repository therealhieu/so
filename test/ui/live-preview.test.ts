import { afterEach, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { activeBuffer, activeWindow } from "../../src/core/state/buffers";
import { SYNC_TS } from "../support/notes";
import { textFile } from "../support/state";
import { cellStyle, type Mounted, mountShell } from "../support/ui";

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

/** Close the explorer and open `path` in the active window. */
function openNote(x: Mounted, path: string, text: string) {
  x.keys("<leader>e");
  x.open(path, text);
}

const lines = (x: Mounted) => {
  const b = activeBuffer(x.store.get());
  return Array.from({ length: b?.text.lineCount ?? 0 }, (_, i) =>
    b?.text.line(i),
  );
};

test("reading view refuses edits with a hint and still moves", async () => {
  m = await mountShell({ cols: 100, rows: 30 });
  openNote(m, "notes/plan.md", "# Plan\n\nFirst **line**.\nSecond line.\n");
  m.keys("<leader>m<leader>m");
  expect(activeBuffer(m.store.get())?.view).toBe("reading");
  // A yank changes no text, so it works and gives `p` something to put.
  m.keys("yy");
  const before = lines(m);
  for (const seq of ["x", "i", "p", "dd"]) {
    m.keys(seq);
    expect(lines(m)).toEqual(before);
    expect(m.store.get().vim.mode).toBe("normal");
    expect(await m.row(-1)).toContain("reading mode — <leader>m to edit");
  }
  m.keys("j");
  expect(activeWindow(m.store.get())?.content.cursor.line).toBe(1);
});

const TOUR_MD = readFileSync(
  new URL("../fixtures/tour.md", import.meta.url),
  "utf8",
);
const ROADMAP_MD = `# So roadmap\n\n## Goals\n\n${Array.from(
  { length: 16 },
  (_, i) => `- Goal ${i + 1}`,
).join("\n")}\n\n## Later\n\nNothing yet.\n`;

/** The sign cell sits right of the line numbers: four digits and a space. */
const SIGN_X = 5;
const signOf = (row: string) => [...row][SIGN_X] ?? " ";

/** Rows of the editor window: below the bufferline, above the statusline and command line. */
async function windowRows(x: Mounted): Promise<string[]> {
  const rows = (await x.frame()).split("\n");
  return rows.slice(1, x.store.get().terminal.rows - 2);
}

/** Open the tour with its embedded roadmap loaded. */
function openTour(x: Mounted) {
  x.store.dispatch({
    type: "indexBatch",
    summaries: [],
    files: ["tour.md", "so-roadmap.md", "diagram.png"],
    done: 0,
    total: 0,
  });
  openNote(x, "tour.md", TOUR_MD);
  x.store.dispatch({
    type: "fileLoaded",
    path: "so-roadmap.md",
    file: textFile(ROADMAP_MD),
  });
}

test("a note frame paints signs, rules, embed rows, and folded callouts", async () => {
  m = await mountShell({ cols: 100, rows: 80 });
  openTour(m);
  expect(m.effects).toContainEqual({
    kind: "read",
    path: "so-roadmap.md",
    embed: true,
  });

  m.keys("24G");
  let rows = await windowRows(m);
  const revealed = rows.filter((r) => signOf(r) === "▕");
  expect(revealed).toHaveLength(1);
  expect(revealed[0]).toContain("## Quotes and callouts");

  const tip = rows.findIndex((r) => r.includes("Folded tip"));
  expect(rows[tip]).toContain("★ Folded tip (za to open) ▸");
  expect(rows[tip + 1]?.trim()).toMatch(/^\d*$/);
  expect(rows.join("\n")).not.toContain("start folded");

  const title = rows.findIndex((r) => r.includes("↳ so-roadmap#Goals"));
  expect(title).toBeGreaterThan(-1);
  const embed = rows.slice(title, title + 12);

  expect(embed.some((r) => r.includes("│ • Goal 1"))).toBe(true);
  expect(embed.at(-1)).toMatch(/╰ … \d+ more lines/);
  expect(rows.some((r) => r.includes("[image]"))).toBe(true);

  m.keys("G");
  rows = await windowRows(m);
  const rule = rows.find((r) => r.includes("─".repeat(20)));
  expect(rule?.slice(SIGN_X + 1).trimEnd()).toBe("─".repeat(100 - SIGN_X - 1));
});

test("code files paint raw lines and ignore note keys", async () => {
  m = await mountShell({ cols: 100, rows: 30 });
  openNote(m, "scripts/sync.ts", SYNC_TS);
  const raw = SYNC_TS.replace(/\n$/, "").split("\n");
  const rows = await windowRows(m);
  raw.forEach((line, i) => {
    expect((rows[i] ?? "").slice(SIGN_X + 1).trimEnd()).toBe(
      line.replace(/\t/g, " ".repeat(8)).trimEnd(),
    );
  });
  expect(rows.every((r) => signOf(r) === " ")).toBe(true);

  const before = m.store.get();
  m.keys("<leader>m");
  m.keys("2Gwgd");
  const after = m.store.get();
  expect(activeBuffer(after)?.view).toBe("source");
  expect(activeBuffer(after)?.text).toBe(activeBuffer(before)?.text);
  expect(activeBuffer(after)?.path).toBe("scripts/sync.ts");
  const at = activeWindow(after)?.content.cursor;
  m.keys("<CR>");
  expect(activeWindow(m.store.get())?.content.cursor.line).toBe(
    (at?.line ?? 0) + 1,
  );
  expect(activeBuffer(m.store.get())?.text).toBe(activeBuffer(before)?.text);
});

test("a missing embed paints its title in the unresolved link style", async () => {
  m = await mountShell({ cols: 100, rows: 30 });
  m.store.dispatch({
    type: "indexBatch",
    summaries: [],
    files: ["notes/hub.md", "notes/present.md", "notes/gone.md"],
    done: 0,
    total: 0,
  });
  openNote(
    m,
    "notes/hub.md",
    "# Hub\n\nSee [[nowhere]].\n\n![[present]]\n\n![[gone]]\n",
  );
  m.store.dispatch({
    type: "fileLoaded",
    path: "notes/present.md",
    file: textFile("# Present\n\nBody.\n"),
    embed: true,
  });
  m.store.dispatch({
    type: "fileRefused",
    path: "notes/gone.md",
    reason: "io",
    embed: true,
  });
  const lines = (await m.frame()).split("\n");
  const at = (text: string) => {
    const y = lines.findIndex((l) => l.includes(text));
    return { x: [...(lines[y] ?? "")].indexOf(text[0] ?? ""), y };
  };
  const missing = at("↳ gone");
  expect(missing.y).toBeGreaterThan(-1);
  const spans = m.t.captureSpans().lines;
  const style = (p: { x: number; y: number }) => cellStyle(spans, p.x, p.y);
  expect(style(missing)).toEqual(style(at("nowhere")));
  expect(style(missing)).not.toEqual(style(at("↳ present")));
  expect(lines.join("\n")).not.toContain("cannot read file");
});
