import { afterAll, beforeAll, expect, spyOn, test } from "bun:test";
import { readFileSync } from "node:fs";
import * as fsp from "node:fs/promises";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  atomicWrite,
  createEntry,
  createExclusive,
  listDir,
  moveEntry,
  readTextFile,
  removeEntry,
  stampOfFile,
} from "./fs";
import { createExclusionMatcher } from "./ignore";

let root = "";
const matcher = () =>
  createExclusionMatcher(root, (p) => {
    try {
      return readFileSync(p, "utf8");
    } catch {
      return null;
    }
  });

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "so-fs-"));
  await mkdir(join(root, "notes"));
  await writeFile(join(root, "notes/a.md"), "# a\n");
  await writeFile(join(root, "b.md"), "b\n");
  await writeFile(join(root, ".env"), "SECRET=1\n");
  await writeFile(join(root, ".gitignore"), "build/\n");
  await mkdir(join(root, "build"));
  await mkdir(join(root, "loopy"));
  await symlink("..", join(root, "loopy/up"));
  await symlink("notes", join(root, "linked"));
  await symlink("b.md", join(root, "b-link.md"));
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

test("listing shows symlinks with their target kind and skips excluded entries", async () => {
  expect(await listDir(root, "", matcher())).toEqual([
    { name: "linked", kind: "dir" },
    { name: "loopy", kind: "dir" },
    { name: "notes", kind: "dir" },
    { name: "b-link.md", kind: "file" },
    { name: "b.md", kind: "file" },
  ]);
});

test("a linked folder lists only when it is expanded", async () => {
  expect(await listDir(root, "linked", matcher())).toEqual([
    { name: "a.md", kind: "file" },
  ]);
});

test("a folder containing a symlink loop lists without recursion", async () => {
  expect(await listDir(root, "loopy", matcher())).toEqual([
    { name: "up", kind: "dir" },
  ]);
  expect(await listDir(root, "loopy/up/loopy/up", matcher())).toHaveLength(5);
});

test("a hidden file opens by path", async () => {
  const r = await readTextFile(join(root, ".env"));
  expect(r).toMatchObject({ text: "SECRET=1\n", bom: false, eol: "\n" });
});

test("a read error refuses the file as io", async () => {
  expect(await readTextFile(join(root, "missing.md"))).toEqual({
    refused: "io",
  });
  expect(await readTextFile(join(root, "notes"))).toEqual({ refused: "io" });
});

test("a read and a later write of the same bytes give equal stamps", async () => {
  const p = join(root, "stamp.md");
  const written = await atomicWrite(p, "same\n");
  const read = await readTextFile(p);
  expect("stamp" in read && read.stamp).toEqual(written);
  expect(await stampOfFile(p, await stat(p))).toEqual(written);
});

test("a write against a stale stamp is refused as a conflict", async () => {
  const p = join(root, "conflict.md");
  const seen = await atomicWrite(p, "one\n");
  await writeFile(p, "external\n");
  await expect(atomicWrite(p, "mine\n", seen)).rejects.toThrow("conflict");
  expect(await readFile(p, "utf8")).toBe("external\n");
  expect((await readdir(root)).some((n) => n.includes(".so-tmp-"))).toBe(false);
});

const tempFor = (name: string) => join(root, `.${name}.so-tmp-${process.pid}`);

test("a save over a stale temp file writes into a new private temp", async () => {
  const p = join(root, "stale.md");
  await writeFile(p, "old\n");
  await chmod(p, 0o640);
  await writeFile(tempFor("stale.md"), "leftover\n");
  await chmod(tempFor("stale.md"), 0o644);
  const realOpen = fsp.open;
  const modes: number[] = [];
  const spy = spyOn(fsp, "open").mockImplementation(async (...args) => {
    const fd = await realOpen(...args);
    if (String(args[0]).includes(".so-tmp-"))
      modes.push((await fd.stat()).mode & 0o777);
    return fd;
  });
  try {
    await atomicWrite(p, "new\n");
  } finally {
    spy.mockRestore();
  }
  expect(modes).toEqual([0o600]);
  expect(await readFile(p, "utf8")).toBe("new\n");
  expect((await stat(p)).mode & 0o777).toBe(0o640);
  expect((await readdir(root)).some((n) => n.includes(".so-tmp-"))).toBe(false);
});

test("a symlink planted at the temp path is never written through", async () => {
  const p = join(root, "planted.md");
  await writeFile(join(root, "victim.md"), "keep\n");
  await symlink("victim.md", tempFor("planted.md"));
  await atomicWrite(p, "new\n");
  expect(await readFile(join(root, "victim.md"), "utf8")).toBe("keep\n");
  expect(await readFile(p, "utf8")).toBe("new\n");
  expect((await lstat(p)).isSymbolicLink()).toBe(false);
});

test("create and move never overwrite an existing entry", async () => {
  await expect(createEntry(root, "b.md", false)).rejects.toThrow(
    "E13: File exists (b.md)",
  );
  await expect(createEntry(root, "notes", true)).rejects.toThrow(
    "E13: File exists (notes)",
  );
  await expect(moveEntry(root, "notes/a.md", "b.md")).rejects.toThrow(
    "E13: File exists (b.md)",
  );
  expect(await readFile(join(root, "b.md"), "utf8")).toBe("b\n");
  expect(await readFile(join(root, "notes/a.md"), "utf8")).toBe("# a\n");
});

test("create makes missing parents; move and remove act on real paths", async () => {
  await createEntry(root, "projects/new/idea.md", false);
  await createEntry(root, "ideas", true);
  expect(await readFile(join(root, "projects/new/idea.md"), "utf8")).toBe("");
  expect((await stat(join(root, "ideas"))).isDirectory()).toBe(true);
  await moveEntry(root, "projects", "archive/projects");
  expect(
    await readFile(join(root, "archive/projects/new/idea.md"), "utf8"),
  ).toBe("");
  await removeEntry(root, "archive");
  await expect(stat(join(root, "archive"))).rejects.toThrow();
});

const noNewTemp = async (dir: string) =>
  (await readdir(dir)).some((n) => n.includes(".so-new-"));

test("exclusive create publishes the whole text and refuses an existing file", async () => {
  const r = await createExclusive(root, "daily/2026-10-03.md", "# x\n");
  expect(r.created).toBe(true);
  const p = join(root, "daily/2026-10-03.md");
  expect(await readFile(p, "utf8")).toBe("# x\n");
  expect((await stat(p)).mode & 0o777).toBe(0o644);
  expect(r.created && r.stamp).toEqual(await stampOfFile(p, await stat(p)));
  const before = await stat(p);
  expect(await createExclusive(root, "daily/2026-10-03.md", "other")).toEqual({
    created: false,
  });
  expect(await readFile(p, "utf8")).toBe("# x\n");
  expect((await stat(p)).mtimeMs).toBe(before.mtimeMs);
  expect(await noNewTemp(join(root, "daily"))).toBe(false);
});

test("exclusive create refuses a case variant on a case-insensitive volume", async () => {
  await writeFile(join(root, "Variant.md"), "keep\n");
  const insensitive = await stat(join(root, "variant.md")).then(
    () => true,
    () => false,
  );
  if (!insensitive) return;
  expect(await createExclusive(root, "variant.md", "new")).toEqual({
    created: false,
  });
  expect(await readFile(join(root, "Variant.md"), "utf8")).toBe("keep\n");
  expect(await noNewTemp(root)).toBe(false);
});

test("exclusive create falls back to an exclusive open without hard links", async () => {
  const spy = spyOn(fsp, "link").mockImplementation(async () => {
    throw Object.assign(new Error("EPERM: operation not permitted"), {
      code: "EPERM",
    });
  });
  try {
    expect((await createExclusive(root, "nolink.md", "body\n")).created).toBe(
      true,
    );
    expect(await createExclusive(root, "nolink.md", "again")).toEqual({
      created: false,
    });
  } finally {
    spy.mockRestore();
  }
  expect(await readFile(join(root, "nolink.md"), "utf8")).toBe("body\n");
  expect(await noNewTemp(root)).toBe(false);
});

test("exclusive create fails cleanly in a read-only folder", async () => {
  if (process.getuid?.() === 0) return;
  const dir = join(root, "locked");
  await mkdir(dir);
  await chmod(dir, 0o555);
  try {
    await expect(createExclusive(root, "locked/a.md", "x")).rejects.toThrow();
    expect(await noNewTemp(dir)).toBe(false);
    expect(await readdir(dir)).toEqual([]);
  } finally {
    await chmod(dir, 0o755);
  }
});

test("a read reports the file's created time", async () => {
  const p = join(root, "created.md");
  await writeFile(p, "x\n");
  const r = await readTextFile(p);
  const st = await stat(p);
  expect("createdMs" in r && r.createdMs).toBe(
    st.birthtimeMs > 0 ? st.birthtimeMs : st.mtimeMs,
  );
});
