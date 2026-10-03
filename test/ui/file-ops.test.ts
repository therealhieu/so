import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { fullText } from "../../src/core/state/buffers";
import type { DirEntry, FsOp } from "../../src/core/state/types";
import { type Mounted, mountShell, TREE } from "../support/ui";

let m: Mounted;

beforeEach(async () => {
  m = await mountShell({ cols: 120, rows: 36 });
});
afterEach(() => m.destroy());

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
const text = () => {
  const s = m.store.get();
  const w = s.windows.byId[s.windows.active];
  const b = w && s.buffers[w.content.bufferId];
  return b === undefined ? undefined : fullText(b.text);
};

describe("explorer prompts", () => {
  test("a name ending in / creates a folder, and the tree shows it", async () => {
    select("config.yaml");
    m.keys("a");
    expect(await m.frame()).toContain("New file or folder");
    m.keys("ideas/<CR>");
    const op = { kind: "create", from: "ideas", dir: true } as const;
    expect(effectsOf("create")).toEqual([{ kind: "create", op }]);
    complete(op, [{ name: "ideas", kind: "dir" }, ...(TREE[""] ?? [])]);
    expect(await m.frame()).toContain("▸ ideas");
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

  test("rename and move prompts show the current name and path", async () => {
    select("todo.md");
    m.keys("r");
    let frame = await m.frame();
    expect(frame).toContain("Rename");
    expect(frame).toContain("❯ todo.md");
    m.keys("<BS><BS>txt<CR>");
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
    expect((await m.row(-1)).trim()).toBe("Reloaded from disk — u to undo");
    expect(text()).toBe("alpha\nfrom disk");
    m.keys("u");
    expect(text()).toBe("alpha");
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
    expect((await m.row(-1)).trim()).toBe("binary file — not opened");
    expect(frame.split("\n").slice(0, -2)).toEqual(
      before.split("\n").slice(0, -2),
    );
    expect(m.store.get().panels.explorer.cursor).toBe("photo.png");
    m.keys("<leader>e:e big.log<CR>");
    m.store.dispatch({
      type: "fileRefused",
      path: "big.log",
      reason: "tooLarge",
    });
    frame = await m.frame();
    expect((await m.row(-1)).trim()).toBe(
      "file too large — not opened (limit 16 MiB)",
    );
    expect(Object.keys(m.store.get().buffers)).toEqual([]);
    expect(effectsOf("write")).toEqual([]);
  });
});
