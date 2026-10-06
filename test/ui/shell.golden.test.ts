import { afterEach, describe, expect, test } from "bun:test";
import { parseConfig } from "../../src/core/config/toml";
import type { SearchHit } from "../../src/core/state/types";
import { answerSearch, indexFixture, NOTES, SYNC_TS } from "../support/notes";
import { cellStyle, type Mounted, mountShell } from "../support/ui";

const RIGHT = '[explorer]\nposition = "right"\n[preview]\nmode = "live"\n';

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
      const status = segments(await m.status());
      expect(status).toEqual(
        cols >= 100
          ? ["NORMAL", "source", "scripts/sync.ts", "preview off", "1:1"]
          : ["NORMAL", "scripts/sync.ts", "1:1"],
      );
      expect(await m.frame()).toMatchSnapshot();
    });
  });
}

test("a note shows its word count on wide terminals only", async () => {
  m = await mountShell({ cols: 120, rows: 36 });
  openNote(m, "notes/ideas.md", IDEAS_MD);
  expect(segments(await m.status())).toEqual([
    "NORMAL",
    "live",
    "notes/ideas.md",
    "11 words",
    "preview off",
    "1:1",
  ]);
  m.t.resize(80, 24);
  expect(segments(await m.status())).toEqual([
    "NORMAL",
    "notes/ideas.md",
    "1:1",
  ]);
});

test("the statusline shows the preview port after the word count", async () => {
  m = await mountShell({ cols: 120, rows: 36 });
  openNote(m, "notes/plan.md", NOTES["notes/plan.md"] ?? "");
  indexFixture(m);
  m.keys(":Preview<CR>");
  expect(segments(await m.status())).toContain("preview …");
  m.store.dispatch({ type: "previewStarted", port: 8731 });
  expect(segments(await m.status())).toEqual([
    "NORMAL",
    "live",
    "notes/plan.md",
    "← 31 backlinks",
    "14 words",
    "preview :8731",
    "◆ index ready",
    "1:1",
  ]);
  m.open("scripts/sync.ts", SYNC_TS);
  expect(segments(await m.status())).toEqual([
    "NORMAL",
    "source",
    "scripts/sync.ts",
    "jump 2/2",
    "preview :8731",
    "◆ index ready",
    "1:1",
  ]);
  m.t.resize(80, 24);
  expect(segments(await m.status())).toEqual([
    "NORMAL",
    "scripts/sync.ts",
    "jump 2/2",
    "◆ index ready",
    "1:1",
  ]);
});

test("narrow statuslines drop preview, words, then view", async () => {
  const longNote = (n: number) => `notes/${"a".repeat(n - 9)}.md`;
  const shown = async (n: number, cols = 120) => {
    m?.destroy();
    m = await mountShell({ cols, rows: 36 });
    openNote(m, longNote(n), "# Long\n");
    return segments(await m.status());
  };
  expect(await shown(70)).toEqual([
    "NORMAL",
    "live",
    longNote(70),
    "2 words",
    "preview off",
    "1:1",
  ]);
  expect(await shown(80)).toEqual([
    "NORMAL",
    "live",
    longNote(80),
    "2 words",
    "1:1",
  ]);
  expect(await shown(90)).toEqual(["NORMAL", "live", longNote(90), "1:1"]);
  expect(await shown(100)).toEqual(["NORMAL", longNote(100), "1:1"]);
  expect(await shown(20, 80)).toEqual(["NORMAL", longNote(20), "1:1"]);
});

test("on a narrow terminal the explorer floats on its configured edge", async () => {
  m = await mountShell({ cols: 80, rows: 24, config: RIGHT });
  const frame = await m.frame();
  expect(frame).toMatchSnapshot();
  const row = frame.split("\n")[1] ?? "";
  expect(row.trimEnd().endsWith("╮")).toBe(true);
  expect(row.startsWith("╭")).toBe(false);
});

test("a config reload moves the explorer to its new edge", async () => {
  m = await mountShell({ cols: 120, rows: 36 });
  expect((await m.frame()).split("\n")[1]).toStartWith(" NOTES");
  m.store.dispatch({
    type: "configLoaded",
    result: parseConfig(RIGHT),
    reload: true,
  });
  const row = (await m.frame()).split("\n")[1] ?? "";
  expect(row).not.toStartWith(" NOTES");
  expect(row.trimEnd()).toEndWith(" NOTES  ~/notes");
});

test("the explorer marks notes by their registered file type, in any case", async () => {
  m = await mountShell({ cols: 120, rows: 36 });
  m.store.dispatch({
    type: "dirListed",
    dir: "",
    entries: [
      { name: "NOTE.MD", kind: "file" },
      { name: "config.yaml", kind: "file" },
    ],
  });
  const tree = (await m.frame()).split("\n").map((l) => l.slice(0, 30));
  expect(tree).toContain(` \ue609 NOTE.MD${" ".repeat(20)}`);
  expect(tree).toContain(` \ue6a8 config.yaml${" ".repeat(16)}`);
});

test("a split window's long title is cut in the middle and keeps the file name", async () => {
  m = await mountShell({ cols: 80, rows: 24 });
  openNote(m, "projects/archive/2026/quarterly-planning/ideas.md", IDEAS_MD);
  m.keys(":vs<CR>");
  const titles = (await m.row(1)).split("│").map((t) => t.trim());
  expect(titles).toHaveLength(2);
  for (const title of titles) {
    expect(title).toStartWith("projects/archive/20");
    expect(title).toContain("…");
    expect(title).toEndWith("-planning/ideas.md");
  }
});

test("a window whose layout throws still shows the file's raw lines", async () => {
  m = await mountShell({ cols: 120, rows: 36 });
  m.reg.fileTypes.register({
    id: "broken",
    match: { extensions: [".broken"] },
    editor: "text",
    views: [{ id: "source", decorations: [] }],
    analyze: () => {
      throw new Error("analysis failed");
    },
  });
  openNote(m, "notes/data.broken", "first line\n\tsecond line\n");
  const body = (await m.frame()).split("\n").slice(1, 4);
  expect(body[0]).toStartWith("   1  first line");
  expect(body[1]).toContain("second line");
  expect(body[2]).toStartWith("    ~");
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
      styles.normalBadge = await at(1, 35);
      styles.cursorline = await at(10, 1);
      m.keys("i");
      styles.insertBadge = await at(1, 35);
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

describe("index and panels at 120×36", () => {
  const MENTIONS: SearchHit[] = [
    {
      path: "notes/ideas.md",
      line: 2,
      col: 4,
      len: 4,
      text: "The plan is to keep files plain.",
    },
  ];

  test("indexing progress shows in the statusline", async () => {
    m = await mountShell({ cols: 120, rows: 36 });
    openNote(m, "notes/ideas.md", IDEAS_MD);
    m.store.dispatch({
      type: "indexBatch",
      summaries: [],
      files: [],
      done: 4210,
      total: 10000,
    });
    expect(await m.status()).toContain("◌ indexing 4,210/10,000");
    expect(await m.frame()).toMatchSnapshot();
  });

  test("the index-ready toast and the statusline segments", async () => {
    m = await mountShell({ cols: 120, rows: 36 });
    openNote(m, "notes/plan.md", NOTES["notes/plan.md"] ?? "");
    indexFixture(m);
    const frame = await m.frame();
    expect(frame).toContain("✓ index ready");
    expect(segments(await m.status())).toEqual([
      "NORMAL",
      "live",
      "notes/plan.md",
      "← 31 backlinks",
      "14 words",
      "preview off",
      "◆ index ready",
      "1:1",
    ]);
    expect(frame).toMatchSnapshot();
  });

  test("the outline panel marks the current heading", async () => {
    m = await mountShell({ cols: 120, rows: 36 });
    indexFixture(m);
    m.advance(3000);
    openNote(m, "notes/plan.md", NOTES["notes/plan.md"] ?? "");
    m.keys("5G<leader>o");
    const frame = await m.frame();
    expect(frame).toContain(" OUTLINE");
    expect(frame).toContain("▸ Goals");
    expect(frame).toMatchSnapshot();
  });

  test("the backlinks picker names its note in the title", async () => {
    m = await mountShell({ cols: 120, rows: 36 });
    indexFixture(m);
    m.advance(3000);
    openNote(m, "notes/plan.md", NOTES["notes/plan.md"] ?? "");
    m.keys("<leader>sb");
    expect(await m.frame()).toContain("─ Backlinks of plan ─");
  });

  test("with the explorer on the right, the backlinks panel docks left", async () => {
    m = await mountShell({ cols: 120, rows: 36, config: RIGHT });
    indexFixture(m);
    m.advance(3000);
    m.open("notes/plan.md", NOTES["notes/plan.md"] ?? "");
    m.keys("<leader>lb");
    answerSearch(m, MENTIONS);
    const rows = (await m.frame()).split("\n");
    expect(rows[1]?.startsWith(" BACKLINKS")).toBe(true);
    expect(rows[1]?.trimEnd().endsWith(" NOTES  ~/notes")).toBe(true);
    expect(rows.join("\n")).toMatchSnapshot();
    expect(rows.at(-3)).toContain("C-w l back to the editor");
  });

  test("the backlinks panel shows Linked then Unlinked mentions", async () => {
    m = await mountShell({ cols: 120, rows: 36 });
    indexFixture(m);
    m.advance(3000);
    openNote(m, "notes/ideas.md", NOTES["notes/ideas.md"] ?? "");
    m.open("projects/so-roadmap.md", NOTES["projects/so-roadmap.md"] ?? "");
    m.keys("<leader>lb");
    answerSearch(m, [
      { ...(MENTIONS[0] as SearchHit), text: "The so roadmap is next." },
    ]);
    expect(await m.frame()).toMatchSnapshot();
    m.open("notes/plan.md", NOTES["notes/plan.md"] ?? "");
    answerSearch(m, MENTIONS);
    const frame = await m.frame();
    expect(frame).toContain("▾ Linked mentions (31)");
    expect(frame).toMatchSnapshot();
  });

  test("a code file shows source, path, preview, index, and position only", async () => {
    m = await mountShell({ cols: 120, rows: 36 });
    indexFixture(m);
    m.advance(3000);
    openNote(m, "scripts/sync.ts", SYNC_TS);
    expect(segments(await m.status())).toEqual([
      "NORMAL",
      "source",
      "scripts/sync.ts",
      "preview off",
      "◆ index ready",
      "1:1",
    ]);
    expect(await m.frame()).toMatchSnapshot();
  });
});
