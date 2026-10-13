import { afterEach, describe, expect, test } from "bun:test";
import type { SearchHit } from "../../src/core/state/types";
import {
  answerPreview,
  answerSearch,
  FILES,
  indexFixture,
  SYNC_TS,
} from "../support/notes";
import { type Mounted, mountShell } from "../support/ui";

const OVERRIDE = '[keys.normal]\n"<leader>w" = "file.save"\n';

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

/** The fixture indexed, the explorer closed, and `path` open. */
async function opened(path: string, cols = 120, rows = 36): Promise<Mounted> {
  const x = await mountShell({ cols, rows, config: OVERRIDE });
  indexFixture(x);
  x.keys("<leader>e");
  x.open(path, FILES[path] ?? "");
  return x;
}

const pickerLabels = (x: Mounted) => {
  const o = x.store.get().overlay;
  return o.kind === "picker" || o.kind === "palette" || o.kind === "help"
    ? o.picker.items.map((i) => i.label)
    : [];
};
/** The which-key float's rows between its borders. */
async function whichKeyRows(x: Mounted): Promise<string[]> {
  const lines = (await x.frame()).split("\n");
  const top = lines.findIndex((l) => l.startsWith("╭─ <leader>"));
  if (top < 0) return [];
  const bottom = lines.findIndex((l, i) => i > top && l.startsWith("╰"));
  return lines.slice(top + 1, bottom);
}
/** Which-key labels in reading order: columns left to right, rows top to bottom. */
function whichKeyLabels(rows: string[]): string[] {
  const cells = rows.map((r) =>
    r
      .slice(1, -1)
      .split(/\s{2,}/)
      .map((c) => c.trim())
      .filter((c) => c !== ""),
  );
  const out: string[] = [];
  const cols = Math.max(0, ...cells.map((c) => c.length));
  for (let c = 0; c < cols; c++)
    for (const row of cells) if (row[c] !== undefined) out.push(row[c] ?? "");
  return out;
}

const SYNC_HIT: SearchHit = {
  path: "scripts/sync.ts",
  line: 2,
  col: 22,
  len: 4,
  text: "export async function sync(dir: string): Promise<number> {",
};
const PLAN_HIT: SearchHit = {
  path: "notes/plan.md",
  line: 6,
  col: 0,
  len: 4,
  text: "Ship the editor. ^ship",
};

describe("in a note", () => {
  test("which-key opens only after 300 ms and lists actions before groups", async () => {
    m = await opened("notes/plan.md");
    m.keys(" ");
    m.advance(299);
    expect(await whichKeyRows(m)).toEqual([]);
    m.advance(1);
    const labels = whichKeyLabels(await whichKeyRows(m));
    const firstGroup = labels.findIndex((l) => l.includes("→ +"));
    expect(firstGroup).toBeGreaterThan(0);
    expect(labels.slice(firstGroup).every((l) => l.includes("→ +"))).toBe(true);
    expect(labels).toContain("l → +links");
    expect(labels).toContain("w → Save file");

    m.keys("<Esc> f");
    m.advance(100);
    expect(m.store.get().overlay.kind).toBe("none");

    m.keys("<Esc> l");
    m.advance(300);
    expect(whichKeyLabels(await whichKeyRows(m))).toEqual([
      "b → Toggle backlinks panel",
      "r → Rename (update links)",
    ]);
  });

  test("gg after the g popup opens still goes to the first line", async () => {
    m = await opened("notes/plan.md");
    m.keys("Gg");
    m.advance(300);
    expect(
      (await m.frame()).split("\n").some((l) => l.startsWith("╭─ g")),
    ).toBe(true);
    m.keys("g");
    const s = m.store.get();
    expect(s.overlay.kind).toBe("none");
    expect(s.windows.byId[s.windows.active]?.content.cursor.line).toBe(0);
    expect(s.notifications.message).toBeUndefined();
  });

  test("find files ranks by fuzzy score and C-n moves the selection", async () => {
    m = await opened("notes/plan.md");
    m.keys("<leader>ffsrd");
    expect(pickerLabels(m)[0]).toBe("projects/so-roadmap.md");
    m.keys("<Esc><leader>ffsync");
    expect(pickerLabels(m)[0]).toBe("scripts/sync.ts");
    m.keys("<BS><BS><BS><BS>");
    m.keys("<C-n>");
    const o = m.store.get().overlay;
    expect(o.kind === "picker" && o.picker.selected).toBe(1);
    expect(await m.frame()).toContain(`▸ ${pickerLabels(m)[1]}`);
  });

  test("grep rows read path:line with the match marked, and preview the hit", async () => {
    m = await opened("notes/plan.md");
    m.keys("<leader>sgsync");
    m.advance(100);
    answerSearch(m, [SYNC_HIT, PLAN_HIT]);
    answerPreview(m);
    const frame = await m.frame();
    expect(frame).toContain("▸ scripts/sync.ts:3  export");
    expect(frame).toContain("notes/plan.md:7  Ship the editor.");
    // The preview pane at 120 columns shows the file of the selected hit.
    expect(frame).toMatch(/│ scripts\/sync\.ts +│/);
    expect(frame).toContain("export async function sync(dir:");
    const o = m.store.get().overlay;
    expect(o.kind === "picker" && o.picker.items[0]?.matches).toEqual([
      41, 42, 43, 44,
    ]);
  });

  test("the grep preview is absent at 99 columns", async () => {
    m = await opened("notes/plan.md", 99, 30);
    m.keys("<leader>sgsync");
    m.advance(100);
    answerSearch(m, [SYNC_HIT]);
    const frame = await m.frame();
    expect(frame).toContain("▸ scripts/sync.ts:3  export");
    expect(frame).not.toMatch(/│ scripts\/sync\.ts +│/);
    expect(m.effects.some((e) => e.kind === "readPreview")).toBe(false);
  });

  test("palette and help mark the override and label note keys", async () => {
    m = await opened("notes/plan.md");
    m.keys("<leader>:");
    expect(await m.frame()).toMatch(/Save file +file\.save {2}<leader>w ●/);
    m.keys("<Esc><leader>?");
    expect(pickerLabels(m)).toContainEqual("<leader>?  Help: keymap");
    const o = m.store.get().overlay;
    const items = o.kind === "help" ? o.picker.items : [];
    expect(items.find((i) => i.label === "<leader>w  Save file")?.detail).toBe(
      "file.save  ●",
    );
    expect(
      items.find(
        (i) => i.label === "gd  Follow link, or list the notes with this tag",
      )?.detail,
    ).toBe("link.followOrTag  markdown");
  });

  test("the keymap asks before switching off a built-in binding and shows how to undo it", async () => {
    m = await opened("notes/plan.md");
    m.keys("<leader>?");
    m.keys("Find file");
    const listed = await m.frame();
    expect(listed).toContain("C-a add");
    expect(listed).toContain("C-r restore");
    expect(listed).toContain("C-x unbind");
    m.keys("<C-x>");
    const asked = await m.frame();
    expect(asked).toContain("Change built-in keys?");
    expect(asked).toContain('<leader>ff stops running "Find file"');
    expect(asked).toContain("press C-r");
    expect(asked).toContain("y change");
    m.keys("y");
    const off = await m.frame();
    expect(off).toMatch(/<leader>ff {2}Find file +file\.find {2}off/);
  });

  test("a picker resized to 80×24 drops its preview pane", async () => {
    m = await opened("notes/plan.md");
    m.keys("<leader>ff");
    expect(await m.frame()).toMatch(/│ [^│ ]+\.md +│/);
    m.store.dispatch({ type: "resize", cols: 80, rows: 24 });
    const frame = await m.frame();
    expect(frame).toContain("Find files");
    expect(frame).not.toMatch(/│ [^│ ]+\.md +│\s*$/m);
    expect(frame.split("\n").some((l) => l.includes("│ # Plan"))).toBe(false);
  });
});

describe("in scripts/sync.ts", () => {
  test("which-key, the palette, and : completion offer no note commands", async () => {
    m = await opened("scripts/sync.ts");
    expect(m.store.get().buffers[1]?.fileType).toBe("typescript");
    expect(FILES["scripts/sync.ts"]).toBe(SYNC_TS);
    m.keys(" ");
    m.advance(300);
    const labels = whichKeyLabels(await whichKeyRows(m));
    expect(labels).toContain("f → +file");
    expect(labels.some((l) => l.includes("+links"))).toBe(false);

    m.keys("<Esc><leader>:follow");
    expect(await m.frame()).not.toContain("Follow link");
    expect(pickerLabels(m)).not.toContain("Follow link");

    m.keys("<Esc>:link<Tab>");
    expect(m.store.get().vim.cmdline).toBe(":link");
  });
});
