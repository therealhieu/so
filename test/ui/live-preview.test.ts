import { afterEach, expect, test } from "bun:test";
import { activeBuffer, activeWindow } from "../../src/core/state/buffers";
import { type Mounted, mountShell } from "../support/ui";

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
