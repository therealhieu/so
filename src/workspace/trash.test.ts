import { afterAll, beforeAll, expect, spyOn, test } from "bun:test";
import * as fsp from "node:fs/promises";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectTrash, freedesktopTrash, macTrash, trashInfo } from "./trash";

let base = "";
let home = "";
let ws = "";
const at = new Date(2026, 9, 3, 14, 5, 9);

beforeAll(async () => {
  base = await mkdtemp(join(tmpdir(), "so-trash-"));
  ws = join(base, "ws");
  await fsp.mkdir(join(ws, "a"), { recursive: true });
  await fsp.mkdir(join(ws, "b"), { recursive: true });
  const t = await detectTrash({
    platform: "linux",
    env: { XDG_DATA_HOME: join(base, "data") },
    root: ws,
  });
  expect(t.available).toBe(true);
  home = join(base, "data/Trash");
});

afterAll(async () => {
  await rm(base, { recursive: true, force: true });
});

test("a trashed file has a spec info file with its escaped path and local deletion time", async () => {
  const src = join(ws, "My draft.md");
  await writeFile(src, "draft\n");
  await freedesktopTrash(home, () => at).move(src);
  expect(await readFile(join(home, "files/My draft.md"), "utf8")).toBe(
    "draft\n",
  );
  const escaped = src.split("/").map(encodeURIComponent).join("/");
  expect(await readFile(join(home, "info/My draft.md.trashinfo"), "utf8")).toBe(
    `[Trash Info]\nPath=${escaped}\nDeletionDate=2026-10-03T14:05:09\n`,
  );
  expect(escaped).toEndWith("/My%20draft.md");
  expect(trashInfo("/x/a b.md", at)).toBe(
    "[Trash Info]\nPath=/x/a%20b.md\nDeletionDate=2026-10-03T14:05:09\n",
  );
});

test("two trashed files with the same name never overwrite each other", async () => {
  await writeFile(join(ws, "a/draft.md"), "first\n");
  await writeFile(join(ws, "b/draft.md"), "second\n");
  const trash = freedesktopTrash(home, () => at);
  await trash.move(join(ws, "a/draft.md"));
  await trash.move(join(ws, "b/draft.md"));
  expect(await readFile(join(home, "files/draft.md"), "utf8")).toBe("first\n");
  expect(await readFile(join(home, "files/draft.md.2"), "utf8")).toBe(
    "second\n",
  );
  const infos = await readdir(join(home, "info"));
  expect(infos).toContain("draft.md.trashinfo");
  expect(infos).toContain("draft.md.2.trashinfo");
});

test("a failed move leaves no orphan info file and the source intact", async () => {
  const src = join(ws, "cross.md");
  await writeFile(src, "keep\n");
  const exdev = Object.assign(new Error("EXDEV: cross-device link"), {
    code: "EXDEV",
  });
  const spy = spyOn(fsp, "rename").mockImplementation(() =>
    Promise.reject(exdev),
  );
  try {
    await expect(freedesktopTrash(home, () => at).move(src)).rejects.toThrow(
      "EXDEV",
    );
  } finally {
    spy.mockRestore();
  }
  expect(await readFile(src, "utf8")).toBe("keep\n");
  expect(await readdir(join(home, "info"))).not.toContain("cross.md.trashinfo");
});

/** A spawn double that records argv and answers with fixed output and exit code. */
function spawnStub(stdout: string, exit: number) {
  const calls: string[][] = [];
  const spawn = (argv: string[]) => {
    calls.push(argv);
    return {
      exited: Promise.resolve(exit),
      stdout: new Response(stdout).body as ReadableStream<Uint8Array>,
    };
  };
  return { spawn, calls };
}

test("macOS trash trusts the system API's output, not its exit code", async () => {
  const failed = spawnStub("failed\n", 0);
  await expect(macTrash(false, failed.spawn).move("/x/a.md")).rejects.toThrow();
  const ok = spawnStub("ok\n", 0);
  await macTrash(false, ok.spawn).move("/x/a.md");
  const cli = spawnStub("", 1);
  await expect(macTrash(true, cli.spawn).move("/x/a.md")).rejects.toThrow();
  expect(cli.calls).toEqual([["/usr/bin/trash", "/x/a.md"]]);
});

test("a path that looks like script reaches the system API as one argument", async () => {
  const path = "/x/'); doShellScript('x";
  const stub = spawnStub("ok\n", 0);
  await macTrash(false, stub.spawn).move(path);
  const argv = stub.calls[0] ?? [];
  expect(argv.slice(0, 3)).toEqual(["osascript", "-l", "JavaScript"]);
  expect(argv.at(-1)).toBe(path);
  expect(argv.filter((a) => a.includes("doShellScript"))).toEqual([path]);
});

test("trash is unavailable on a platform without a supported trash", async () => {
  const t = await detectTrash({ platform: "win32", env: {}, root: ws });
  expect(t.available).toBe(false);
  await expect(t.move(join(ws, "a"))).rejects.toThrow();
});
