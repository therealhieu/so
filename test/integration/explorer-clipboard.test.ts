import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FileClip } from "../../src/core/state/types";
import type { FileClipboard } from "../../src/workspace/system";
import { type App, startApp, tmpWorkspace, waitFor } from "./helpers";

let app: App;
let outside = "";
/** The system clipboard double: what another program copied, and what so wrote. */
let held: FileClip | null = null;
const written: FileClip[] = [];
const clipboard: FileClipboard = {
  name: "memory",
  write: async (clip) => {
    written.push(clip);
    held = clip;
  },
  read: async () => held,
};
const disk = (path: string) => readFile(join(app.root, path), "utf8");
const exists = (path: string) => Bun.file(join(app.root, path)).exists();
const fsResults = (mark: number) =>
  app.actions.slice(mark).filter((a) => a.type === "fsResult");

beforeAll(async () => {
  const root = await tmpWorkspace({
    "plan.md": "# Plan\n",
    "a.md": "see [x](notes/one.md)\n",
    "notes/one.md": "one\n",
  });
  outside = await mkdtemp(join(tmpdir(), "so-clip-outside-"));
  app = await startApp(root, { index: {}, fileClipboard: clipboard });
  await waitFor(() => app.store.get().index.status === "ready");
});

afterAll(async () => {
  app.stop();
  await rm(app.root, { recursive: true, force: true });
  await rm(outside, { recursive: true, force: true });
});

test("files copied in another program paste in, a taken name getting copy", async () => {
  await writeFile(join(outside, "plan.md"), "from Finder\n");
  await mkdir(join(outside, "pics"));
  await writeFile(join(outside, "pics/cat.txt"), "meow\n");
  held = {
    op: "copy",
    paths: [join(outside, "plan.md"), join(outside, "pics")],
  };
  app.select("a.md");
  const mark = app.actions.length;
  app.keys("p");
  await waitFor(() => fsResults(mark).length === 2);
  expect(fsResults(mark).every((a) => a.type === "fsResult" && a.ok)).toBe(
    true,
  );
  expect(await disk("plan copy.md")).toBe("from Finder\n");
  expect(await disk("plan.md")).toBe("# Plan\n");
  expect(await disk("pics/cat.txt")).toBe("meow\n");
  expect(await Bun.file(join(outside, "plan.md")).exists()).toBe(true);
  await waitFor(() => app.store.get().index.ix.files.has("plan copy.md"));
});

test("y puts the selection's absolute path on the system clipboard", async () => {
  app.select("notes");
  app.keys("y");
  await waitFor(() => written.length > 0);
  expect(written.at(-1)).toEqual({
    op: "copy",
    paths: [join(app.root, "notes")],
  });
});

test("a note cut with x pastes into another folder with its links updated", async () => {
  app.select("notes");
  app.keys("l");
  await waitFor(
    () => app.store.get().panels.explorer.entries.notes !== undefined,
  );
  app.select("notes/one.md");
  app.keys("x");
  // Finder cannot cut, so the clipboard says copy; the explorer's cut decides.
  held = { op: "copy", paths: [join(app.root, "notes/one.md")] };
  app.select("a.md");
  const mark = app.actions.length;
  app.keys("p");
  await waitFor(() => fsResults(mark).length === 1);
  await waitFor(() =>
    app.actions.slice(mark).some((a) => a.type === "editsApplied"),
  );
  expect(await exists("notes/one.md")).toBe(false);
  expect(await disk("one.md")).toBe("one\n");
  expect(await disk("a.md")).toBe("see [x](one.md)\n");
  expect(app.store.get().panels.explorer.clip).toBeUndefined();
});
