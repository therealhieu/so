import { afterEach, describe, expect, test } from "bun:test";
import type { CapturedSpan } from "@opentui/core";
import { type Mounted, mountShell } from "../support/ui";

const SYNC_TS = `import { readFile } from "node:fs/promises";

export async function sync(dir: string): Promise<number> {
\tconst text = await readFile(dir, "utf8"); // whole file
\treturn text.length;
}
`;
const IDEAS_MD =
  "# Ideas\n\nA terminal editor for notes.\n- keep files plain\n";

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

/** A buffer whose write on leaving Insert failed with a permission error. */
function failSave(x: Mounted, path: string) {
  x.keys("Ax<Esc>");
  x.store.dispatch({ type: "saveFailed", path, reason: "EACCES" });
}

/** An info toast (from keeping your version in a conflict) and an error toast. */
function raiseToasts(x: Mounted) {
  x.keys("Ay<Esc>");
  x.store.dispatch({
    type: "fileChanged",
    event: { kind: "changed", path: "notes/ideas.md", isDir: false },
  });
  x.store.dispatch({
    type: "fileLoaded",
    path: "notes/ideas.md",
    file: {
      text: "# Ideas\nchanged on disk\n",
      bom: false,
      eol: "\n",
      stamp: { mtimeMs: 9, size: 9, hash: "h9" },
    },
  });
  x.keys("k");
  x.store.dispatch({
    type: "fsResult",
    op: { kind: "trash", from: "todo.md" },
    ok: false,
    reason: "permission denied",
  });
}

/** The statusline's segments, in order. */
const segments = (row: string) =>
  row
    .trim()
    .split(/\s+│\s+|\s{2,}/)
    .filter((x) => x !== "");

for (const [cols, rows] of [
  [120, 36],
  [80, 24],
] as const) {
  describe(`shell at ${cols}×${rows}`, () => {
    test("startup shows the explorer focused and an empty window", async () => {
      m = await mountShell({ cols, rows });
      expect(await m.frame()).toMatchSnapshot();
    });

    test("explorer hidden with a note open", async () => {
      m = await mountShell({ cols, rows });
      openNote(m, "notes/ideas.md", IDEAS_MD);
      expect(await m.frame()).toMatchSnapshot();
    });

    test("a vertical split shows winbars and a separator", async () => {
      m = await mountShell({ cols, rows });
      openNote(m, "notes/ideas.md", IDEAS_MD);
      m.keys(":vs<CR>");
      expect(await m.frame()).toMatchSnapshot();
    });

    test("a failed save shows its reason and retry time", async () => {
      m = await mountShell({ cols, rows });
      openNote(m, "notes/ideas.md", IDEAS_MD);
      failSave(m, "notes/ideas.md");
      const frame = await m.frame();
      expect(frame).toContain("✗ save failed: EACCES · retry in 1s");
      expect(frame).toMatchSnapshot();
    });

    test("info and error toasts stack at the top right", async () => {
      m = await mountShell({ cols, rows });
      openNote(m, "notes/ideas.md", IDEAS_MD);
      raiseToasts(m);
      const frame = await m.frame();
      expect(frame).toContain("✓ Kept your version — saved");
      expect(frame).toContain("✗ Move to Trash failed");
      expect(frame).toMatchSnapshot();
    });

    test("a code file shows the source view and no word count", async () => {
      m = await mountShell({ cols, rows });
      openNote(m, "scripts/sync.ts", SYNC_TS);
      const status = segments(await m.row(-2));
      expect(status).toEqual(
        cols >= 100
          ? ["NORMAL", "source", "scripts/sync.ts", "1:1"]
          : ["NORMAL", "scripts/sync.ts", "1:1"],
      );
      expect(await m.frame()).toMatchSnapshot();
    });
  });
}

test("a note shows its word count on wide terminals only", async () => {
  m = await mountShell({ cols: 120, rows: 36 });
  openNote(m, "notes/ideas.md", IDEAS_MD);
  expect(segments(await m.row(-2))).toEqual([
    "NORMAL",
    "source",
    "notes/ideas.md",
    "11 words",
    "1:1",
  ]);
  m.t.resize(80, 24);
  expect(segments(await m.row(-2))).toEqual([
    "NORMAL",
    "notes/ideas.md",
    "1:1",
  ]);
});

test("an info toast expires after 3 s and an error toast stays", async () => {
  m = await mountShell({ cols: 120, rows: 36 });
  openNote(m, "notes/ideas.md", IDEAS_MD);
  raiseToasts(m);
  m.advance(3000);
  let frame = await m.frame();
  expect(frame).not.toContain("Kept your version");
  expect(frame).toContain("✗ Move to Trash failed");
  m.advance(7000);
  frame = await m.frame();
  expect(frame).toContain("✗ Move to Trash failed");
});

/** The style of the first cell of screen row `y` at column `x`. */
function cellStyle(lines: { spans: CapturedSpan[] }[], x: number, y: number) {
  let col = 0;
  for (const sp of lines[y]?.spans ?? []) {
    if (x < col + sp.width) {
      const color = (c: CapturedSpan["fg"]) =>
        c.intent === "default" ? "default" : c.toInts().join(",");
      return { fg: color(sp.fg), bg: color(sp.bg), attrs: sp.attributes };
    }
    col += sp.width;
  }
  return undefined;
}

describe("themes", () => {
  for (const theme of ["dark", "light", "nocolor"] as const) {
    test(`${theme}: badges, selection, cursorline, dirty marker, error toast`, async () => {
      m = await mountShell({
        cols: 120,
        rows: 36,
        color: theme === "nocolor" ? "nocolor" : "color",
        theme: theme === "light" ? "light" : "dark",
      });
      openNote(m, "notes/ideas.md", IDEAS_MD);
      const x = m;
      const at = async (cx: number, cy: number) => {
        await x.frame();
        return cellStyle(x.t.captureSpans().lines, cx, cy);
      };
      const styles: Record<string, unknown> = {};
      styles.normalBadge = await at(1, 34);
      styles.cursorline = await at(10, 1);
      m.keys("i");
      styles.insertBadge = await at(1, 34);
      m.keys("<Esc>vj");
      styles.selection = await at(6, 1);
      m.keys("<Esc>Az<Esc>");
      styles.dirtyMarker = await at(10, 0);
      m.store.dispatch({
        type: "fsResult",
        op: { kind: "trash", from: "todo.md" },
        ok: false,
        reason: "permission denied",
      });
      const frame = (await m.frame()).split("\n");
      const toastRow = frame.findIndex((l) => l.includes("✗ Move"));
      styles.errorToast = await at(
        [...(frame[toastRow] ?? "")].indexOf("✗"),
        toastRow,
      );
      expect(styles).toMatchSnapshot();
      if (theme === "nocolor") {
        const colours = new Set(
          m.t
            .captureSpans()
            .lines.flatMap((l) => l.spans)
            .flatMap((sp) => [sp.fg.intent, sp.bg.intent]),
        );
        expect([...colours]).toEqual(["default"]);
      }
    });
  }
});
