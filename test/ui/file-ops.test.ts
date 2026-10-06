import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { summarize } from "../../src/core/features/links/summarize";
import { scanDoc } from "../../src/core/lang/markdown/scan";
import { fullText } from "../../src/core/state/buffers";
import type { DirEntry, FsOp } from "../../src/core/state/types";
import { type Mounted, mountShell, TREE } from "../support/ui";

let m: Mounted;

beforeEach(async () => {
  m = await mountShell({ cols: 120, rows: 36 });
});
afterEach(() => m.destroy());

/** The tree's Nerd Font icons: a closed folder, a note, a YAML file. */
const DIR = "\uf07b";
const NOTE = "\ue609";
const YAML = "\ue6a8";
const effectsOf = (kind: string) => m.effects.filter((e) => e.kind === kind);
const select = (path: string) => {
  while (m.store.get().panels.explorer.cursor !== path) {
    const before = m.store.get().panels.explorer.cursor;
    m.keys("j");
    if (m.store.get().panels.explorer.cursor === before)
      throw new Error(`no row ${path}`);
  }
};
/** Answer a file-system effect, then the relisting of the root it asks for. */
function complete(op: FsOp, root: DirEntry[]) {
  m.store.dispatch({ type: "fsResult", op, ok: true });
  m.store.dispatch({ type: "dirListed", dir: "", entries: root });
}
/** The explorer's entry rows, from the docked tree's columns. */
const tree = async () =>
  (await m.frame())
    .split("\n")
    .slice(2, 34)
    .map((l) => l.slice(1, 30).trimEnd())
    .filter((l) => l !== "");
/** A finished index over `notes` (path → text); its toast is dismissed. */
function indexed(notes: Record<string, string>) {
  const summaries = Object.entries(notes).map(([p, t]) =>
    summarize(p, { mtime: 1, size: 0, ctime: 1 }, scanDoc(t)),
  );
  const files = Object.keys(notes);
  m.store.dispatch({
    type: "indexBatch",
    summaries,
    files,
    done: files.length,
    total: files.length,
  });
  m.store.dispatch({ type: "indexReady" });
  m.advance(3000);
}
/** The hardware cursor's screen cell. */
const cursorAt = async () => {
  await m.frame();
  const c = m.t.renderer.getCursorState();
  return c === undefined ? undefined : { x: c.x - 1, y: c.y - 1 };
};
const text = () => {
  const s = m.store.get();
  const w = s.windows.byId[s.windows.active];
  const b = w && s.buffers[w.content.bufferId];
  return b === undefined ? undefined : fullText(b.text);
};

describe("explorer prompts", () => {
  test("a opens a name field in the tree under the target folder", async () => {
    select("config.yaml");
    m.keys("a");
    let frame = await m.frame();
    expect(frame).not.toContain("New file or folder");
    expect(await tree()).toEqual([
      `${DIR} notes`,
      `${DIR} scripts`,
      `${YAML} config.yaml`,
      NOTE,
      `${NOTE} todo.md`,
    ]);
    m.keys("ide");
    expect(await cursorAt()).toEqual({ x: 6, y: 5 });
    m.keys("<Esc>kk");
    expect(m.store.get().panels.explorer.cursor).toBe("notes");
    m.keys("adraft");
    frame = await m.frame();
    expect(frame).not.toContain("❯");
    expect(await tree()).toEqual([
      `${DIR} notes`,
      `  ${NOTE} draft`,
      `${DIR} scripts`,
      `${YAML} config.yaml`,
      `${NOTE} todo.md`,
    ]);
  });

  test("a name ending in / creates a folder, and the tree shows it", async () => {
    select("config.yaml");
    m.keys("aideas/<CR>");
    const op = { kind: "create", from: "ideas", dir: true } as const;
    expect(effectsOf("create")).toEqual([{ kind: "create", op }]);
    complete(op, [{ name: "ideas", kind: "dir" }, ...(TREE[""] ?? [])]);
    expect(await m.frame()).toContain(`${DIR} ideas`);
  });

  test("a name without an extension gets .md; one with an extension keeps it", () => {
    select("config.yaml");
    m.keys("adraft<CR>");
    m.keys("async.ts<CR>");
    expect(effectsOf("create")).toEqual([
      { kind: "create", op: { kind: "create", from: "draft.md", dir: false } },
      { kind: "create", op: { kind: "create", from: "sync.ts", dir: false } },
    ]);
  });

  test("r edits the name in place; m asks for the new path", async () => {
    indexed({ "todo.md": "" });
    select("todo.md");
    m.keys("r");
    let frame = await m.frame();
    expect(frame).not.toContain("Rename");
    expect(await tree()).toEqual([
      `${DIR} notes`,
      `${DIR} scripts`,
      `${YAML} config.yaml`,
      `${NOTE} todo.md`,
      "  No links to update",
    ]);
    expect(await cursorAt()).toEqual({ x: 10, y: 5 });
    m.keys("<BS><BS>txt");
    expect((await tree())[3]).toBe(`${NOTE} todo.txt`);
    m.keys("<CR>");
    expect(effectsOf("rename")).toEqual([
      {
        kind: "rename",
        op: { kind: "rename", from: "todo.md", to: "todo.txt" },
      },
    ]);
    m.keys("m");
    frame = await m.frame();
    expect(frame).toContain("Move to");
    expect(frame).toContain("❯ todo.md");
    m.keys("<Esc>");
    expect(m.store.get().overlay.kind).toBe("none");
  });

  test("explorer move shows the link impact before Enter", async () => {
    indexed({
      "notes/ideas.md": "[[plan]] and [[plan|the plan]]\n",
      "notes/plan.md": "# Plan\n",
      "todo.md": "- [ ] [read](notes/plan.md)\n",
    });
    m.keys("l");
    select("notes/plan.md");
    m.keys(`m${"<BS>".repeat(13)}archive/roadmap.md`);
    let frame = await m.frame();
    expect(frame).toContain("❯ archive/roadmap.md");
    expect(frame).toContain("3 links in 2 files will be updated");
    m.keys(`${"<BS>".repeat(18)}notes/ideas.md`);
    frame = await m.frame();
    expect(frame).toContain("✗ notes/ideas.md already exists");
    m.keys("<CR>");
    expect(effectsOf("move")).toEqual([]);
    expect(m.store.get().overlay.kind).toBe("prompt");
  });

  test("rename and move wait for the index", async () => {
    select("todo.md");
    m.keys("r");
    expect(m.store.get().overlay.kind).toBe("none");
    expect(await m.message()).toContain(
      "index not ready — try again when indexing finishes",
    );
  });

  test("delete asks to move to the Trash when it is available", async () => {
    m.store.dispatch({ type: "trashAvailable", available: true });
    select("todo.md");
    m.keys("d");
    expect(await m.frame()).toContain("Move to Trash? [y/N]");
    m.keys("y");
    expect(effectsOf("trash")).toEqual([
      { kind: "trash", op: { kind: "trash", from: "todo.md" } },
    ]);
  });

  test("permanent delete ignores Enter until the exact name is typed", async () => {
    m.store.dispatch({ type: "trashAvailable", available: false });
    select("todo.md");
    m.keys("d");
    let frame = await m.frame();
    expect(frame).toContain("This cannot be undone");
    m.keys("todo<CR>");
    frame = await m.frame();
    expect(frame).toContain("⏎ disabled until the name matches");
    expect(m.store.get().overlay.kind).toBe("prompt");
    expect(effectsOf("trash")).toEqual([]);
    m.keys(".md");
    expect(await m.frame()).toContain("⏎ delete permanently");
    m.keys("<CR>");
    expect(effectsOf("trash")).toEqual([
      {
        kind: "trash",
        op: { kind: "trash", from: "todo.md", permanent: true },
      },
    ]);
  });
});

describe("disk changes", () => {
  const disk = (body: string, n: number) => ({
    text: body,
    bom: false,
    eol: "\n" as const,
    stamp: { mtimeMs: n, size: n, hash: `h${n}` },
  });
  const changed = (body: string, n: number) => {
    m.store.dispatch({
      type: "fileChanged",
      event: { kind: "changed", path: "todo.md", isDir: false },
    });
    m.store.dispatch({
      type: "fileLoaded",
      path: "todo.md",
      file: disk(body, n),
    });
  };

  test("a conflict pauses autosave and offers keep, take, and a diff", async () => {
    m.keys("<leader>e");
    m.open("todo.md", "alpha\nbeta\ngamma\n");
    m.keys("ccBETA<Esc>");
    changed("alpha\nbeta\ngamma\ndelta\n", 7);
    let frame = await m.frame();
    expect(frame).toContain("File changed on disk");
    expect(frame).toContain("autosave paused");
    expect(frame).toContain("k keep mine");
    m.keys("<Esc>");
    expect(m.store.get().overlay.kind).toBe("conflict");
    m.keys("d");
    frame = await m.frame();
    expect(frame).toContain("− BETA");
    expect(frame).toContain("+ alpha");
    expect(frame).toContain("+ delta");
    m.keys("q");
    frame = await m.frame();
    expect(frame).toContain("File changed on disk");
    expect(frame).not.toContain("+ delta");
    const writes = effectsOf("write").length;
    m.keys("k");
    frame = await m.frame();
    expect(frame).toContain("✓ Kept your version — saved");
    expect(effectsOf("write").length).toBe(writes + 1);
  });

  test("a clean buffer reloads with a notice, and u undoes the reload", async () => {
    m.keys("<leader>e");
    m.open("todo.md", "alpha\n");
    changed("alpha\nfrom disk\n", 8);
    expect((await m.message()).trim()).toBe("Reloaded from disk — u to undo");
    expect(text()).toBe("alpha\nfrom disk");
    m.keys("u");
    expect(text()).toBe("alpha");
  });
});

describe("at 80×24", () => {
  beforeEach(async () => {
    m.destroy();
    m = await mountShell({ cols: 80, rows: 24 });
  });

  /** Frame rows that hold `text` in full, inside a float's right border. */
  const fits = (frame: string, text: string) =>
    frame
      .split("\n")
      .some((l) => l.includes(text) && l.trimEnd().endsWith("│"));

  test("trash and typed-confirm prompts show their whole text", async () => {
    m.store.dispatch({ type: "trashAvailable", available: true });
    select("todo.md");
    m.keys("d");
    let frame = await m.frame();
    for (const text of [
      "Move to Trash? [y/N]",
      "todo.md",
      "y move to Trash   N cancel",
    ])
      expect(fits(frame, text)).toBe(true);
    m.keys("<Esc>");
    m.store.dispatch({ type: "trashAvailable", available: false });
    m.keys("d");
    frame = await m.frame();
    for (const text of [
      "✗ Trash is not available",
      "This cannot be undone. Type the file name to confirm:",
      "⏎ disabled until the name matches · esc cancel",
    ])
      expect(fits(frame, text)).toBe(true);
  });

  test("the conflict dialog shows its whole text, and its diff stacks in one column", async () => {
    m.keys("<leader>e");
    m.open("todo.md", "alpha\nbeta\ngamma\n");
    m.keys("ccBETA<Esc>");
    m.store.dispatch({
      type: "fileChanged",
      event: { kind: "changed", path: "todo.md", isDir: false },
    });
    m.store.dispatch({
      type: "fileLoaded",
      path: "todo.md",
      file: {
        text: "alpha\nbeta\ngamma\ndelta\n",
        bom: false,
        eol: "\n",
        stamp: { mtimeMs: 7, size: 7, hash: "h7" },
      },
    });
    const dialog = await m.frame();
    for (const text of [
      "▲ todo.md changed on disk",
      "while you have unsaved edits. Nothing was overwritten.",
      "k keep mine    t take disk    d view diff",
    ])
      expect(fits(dialog, text)).toBe(true);
    expect(dialog).toContain("autosave paused until you choose");
    m.keys("d");
    const rows = (await m.frame()).split("\n").map((l) => l.trimEnd());
    expect(rows[1]).toBe(" yours − · disk +");
    expect(rows.slice(2, 7)).toEqual([
      "− BETA",
      "+ alpha",
      "  beta",
      "  gamma",
      "+ delta",
    ]);
    // Body rows 1–21: no side-by-side separator.
    expect(rows.slice(1, 22).some((l) => l.includes("│"))).toBe(false);
  });
});

describe("refused files", () => {
  test("a binary file and a file over 16 MiB do not open", async () => {
    m.store.dispatch({
      type: "dirListed",
      dir: "",
      entries: [...(TREE[""] ?? []), { name: "photo.png", kind: "file" }],
    });
    select("photo.png");
    const before = await m.frame();
    m.keys("<CR>");
    expect(effectsOf("read")).toEqual([{ kind: "read", path: "photo.png" }]);
    m.store.dispatch({
      type: "fileRefused",
      path: "photo.png",
      reason: "binary",
    });
    let frame = await m.frame();
    expect((await m.message()).trim()).toBe("binary file — not opened");
    // Nothing changes but the message row and the statusline.
    expect(frame.split("\n").slice(0, -3)).toEqual(
      before.split("\n").slice(0, -3),
    );
    expect(m.store.get().panels.explorer.cursor).toBe("photo.png");
    m.keys("<leader>e:e big.log<CR>");
    m.store.dispatch({
      type: "fileRefused",
      path: "big.log",
      reason: "tooLarge",
    });
    frame = await m.frame();
    expect((await m.message()).trim()).toBe(
      "file too large — not opened (limit 16 MiB)",
    );
    expect(Object.keys(m.store.get().buffers)).toEqual([]);
    expect(effectsOf("write")).toEqual([]);
  });
});
