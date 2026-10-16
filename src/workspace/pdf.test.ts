import { afterAll, beforeAll, expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  realpath,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { makeBookPdf, makePdf, makeTextPdf } from "../../test/support/pdf";
import {
  createPdfRasterizer,
  macFontConfig,
  parsePdfPages,
  popplerEnv,
  soCacheDir,
  splitPdfPages,
} from "./pdf";
import { bunRun, type ToolRun } from "./tool-run";

let root: string;
let outside: string;

beforeAll(async () => {
  root = await realpath(await mkdtemp(join(tmpdir(), "so-pdf-")));
  outside = await realpath(await mkdtemp(join(tmpdir(), "so-pdf-out-")));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "docs/paper.pdf"), makePdf(2));
  await writeFile(join(outside, "secret.pdf"), makePdf(1));
  await symlink(join(outside, "secret.pdf"), join(root, "docs/link.pdf"));
  await writeFile(
    join(root, "docs/book.pdf"),
    makeBookPdf(
      [["Intro: attention please"], [], ["Methods", "more attention"]],
      [
        { title: "Introduction", page: 1 },
        {
          title: "Methods & data",
          page: 3,
          children: [{ title: "Sub", page: 3 }],
        },
      ],
    ),
  );
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
  await rm(outside, { recursive: true, force: true });
});

const which = (cmd: string) => `/bin/${cmd}`;
/** A one-pixel PPM, as pdftoppm writes. */
const PIXEL = new Uint8Array([
  ...new TextEncoder().encode("P6\n1 1\n255\n"),
  1,
  2,
  3,
]);
const ok = (stdout: string | Uint8Array) => ({
  code: 0,
  stdout:
    typeof stdout === "string" ? new TextEncoder().encode(stdout) : stdout,
  stderr: "",
});

test("the page count comes from pdfinfo's Pages line", () => {
  expect(parsePdfPages("Title: x\nPages:          12\nEncrypted: no\n")).toBe(
    12,
  );
  expect(parsePdfPages("Title: x\n")).toBeUndefined();
});

test("a page runs pdftoppm on the real path, one page at the snapped width", async () => {
  const calls: string[][] = [];
  const run: ToolRun = async (argv) => {
    calls.push(argv);
    return ok(PIXEL);
  };
  const pdf = createPdfRasterizer({ root, which, run });
  expect(
    await pdf.page({ path: "docs/paper.pdf", page: 2, width: 700 }),
  ).toEqual({ rgba: new Uint8Array([1, 2, 3, 255]), width: 1, height: 1 });
  expect(calls).toEqual([
    [
      "/bin/pdftoppm",
      "-f",
      "2",
      "-l",
      "2",
      "-scale-to-x",
      "704",
      "-scale-to-y",
      "-1",
      join(root, "docs/paper.pdf"),
    ],
  ]);
});

test("without Poppler the count is missing and a page rejects", async () => {
  const pdf = createPdfRasterizer({ root, which: () => null, run: bunRun });
  expect(await pdf.info("docs/paper.pdf")).toEqual({ kind: "missing" });
  await expect(
    pdf.page({ path: "docs/paper.pdf", page: 1, width: 512 }),
  ).rejects.toThrow("Poppler (pdftoppm) not found");
});

test("Poppler's error line is the reason a PDF fails", async () => {
  const run: ToolRun = async () => ({
    code: 1,
    stdout: new Uint8Array(),
    stderr:
      "Syntax Warning: May not be a PDF file (continuing anyway)\nSyntax Error: Couldn't find trailer dictionary\n",
  });
  const pdf = createPdfRasterizer({ root, which, run });
  expect(await pdf.info("docs/paper.pdf")).toEqual({
    kind: "failed",
    reason: "Couldn't find trailer dictionary",
  });
  await expect(
    pdf.page({ path: "docs/paper.pdf", page: 1, width: 512 }),
  ).rejects.toThrow("Couldn't find trailer dictionary");
});

test("paths outside the workspace are refused before Poppler runs", async () => {
  let ran = 0;
  const run: ToolRun = async () => {
    ran++;
    return ok("Pages: 1\n");
  };
  const pdf = createPdfRasterizer({ root, which, run });
  expect(await pdf.info("../x.pdf")).toMatchObject({ kind: "failed" });
  expect(await pdf.info("docs/link.pdf")).toEqual({
    kind: "failed",
    reason: "docs/link.pdf: outside the workspace",
  });
  expect(ran).toBe(0);
});

test("at most two Poppler runs go at once", async () => {
  let active = 0;
  let peak = 0;
  const run: ToolRun = async () => {
    active++;
    peak = Math.max(peak, active);
    await Bun.sleep(5);
    active--;
    return ok(PIXEL);
  };
  const pdf = createPdfRasterizer({ root, which, run });
  await Promise.all(
    [1, 2, 3, 4, 5].map((page) =>
      pdf.page({ path: "docs/paper.pdf", page, width: 256 }),
    ),
  );
  expect(peak).toBe(2);
});

test("pdftotext output splits into pages at its form feeds", () => {
  expect(splitPdfPages("one\n\fttwo\n\f")).toEqual(["one\n", "ttwo\n"]);
  expect(splitPdfPages("")).toEqual([""]);
});

test("text and contents run pdftotext and pdftohtml on the real path", async () => {
  const calls: string[][] = [];
  const run: ToolRun = async (argv) => {
    calls.push(argv);
    return ok(
      argv[0] === "/bin/pdftotext"
        ? "a\fb\f"
        : '<pdf2xml><outline><item page="2">Two</item></outline></pdf2xml>',
    );
  };
  const pdf = createPdfRasterizer({ root, which, run });
  expect(await pdf.text("docs/paper.pdf")).toEqual({
    kind: "ok",
    pages: ["a", "b"],
  });
  expect(await pdf.outline("docs/paper.pdf")).toEqual({
    kind: "ok",
    items: [{ title: "Two", page: 2, depth: 0 }],
  });
  const path = join(root, "docs/paper.pdf");
  expect(calls).toEqual([
    ["/bin/pdftotext", "-enc", "UTF-8", path, "-"],
    [
      "/bin/pdftohtml",
      "-xml",
      "-i",
      "-q",
      "-stdout",
      "-f",
      "1",
      "-l",
      "1",
      path,
    ],
  ]);
});

test("a page's layout runs pdftotext -bbox-layout on that page only", async () => {
  const calls: string[][] = [];
  const run: ToolRun = async (argv) => {
    calls.push(argv);
    return ok(
      '<page width="10" height="20"><line><word xMin="1" yMin="2" xMax="3" yMax="4">Hi</word></line></page>',
    );
  };
  const pdf = createPdfRasterizer({ root, which, run });
  expect(await pdf.layout("docs/paper.pdf", 2)).toEqual({
    kind: "ok",
    layout: {
      width: 10,
      height: 20,
      lines: [[{ text: "Hi", x0: 1, y0: 2, x1: 3, y1: 4 }]],
    },
  });
  const path = join(root, "docs/paper.pdf");
  expect(calls).toEqual([
    [
      "/bin/pdftotext",
      "-bbox-layout",
      "-enc",
      "UTF-8",
      "-f",
      "2",
      "-l",
      "2",
      path,
      "-",
    ],
  ]);
});

test("text and contents report missing Poppler, failures, and outside paths", async () => {
  const none = createPdfRasterizer({ root, which: () => null });
  expect(await none.layout("docs/paper.pdf", 1)).toEqual({ kind: "missing" });
  expect(await none.text("docs/paper.pdf")).toEqual({ kind: "missing" });
  expect(await none.outline("docs/paper.pdf")).toEqual({ kind: "missing" });
  const run: ToolRun = async () => ({
    code: 1,
    stdout: new Uint8Array(),
    stderr: "Syntax Error: Couldn't find trailer dictionary\n",
  });
  const bad = createPdfRasterizer({ root, which, run });
  expect(await bad.text("docs/paper.pdf")).toEqual({
    kind: "failed",
    reason: "Couldn't find trailer dictionary",
  });
  expect(await bad.layout("docs/link.pdf", 1)).toEqual({
    kind: "failed",
    reason: "docs/link.pdf: outside the workspace",
  });
  expect(await bad.outline("docs/link.pdf")).toEqual({
    kind: "failed",
    reason: "docs/link.pdf: outside the workspace",
  });
});

const poppler = Bun.which("pdftoppm") !== null && Bun.which("pdfinfo") !== null;

test.skipIf(!poppler)(
  "real Poppler counts pages and draws PNG pages",
  async () => {
    const pdf = createPdfRasterizer({ root, which: (c) => Bun.which(c) });
    expect(await pdf.info("docs/paper.pdf")).toEqual({ kind: "ok", pages: 2 });
    const page = await pdf.page({
      path: "docs/paper.pdf",
      page: 2,
      width: 256,
    });
    expect(page).toMatchObject({
      width: 256,
      height: 384,
    });
  },
);

test.skipIf(Bun.which("pdftotext") === null || Bun.which("pdftohtml") === null)(
  "real Poppler reads text per page and the table of contents",
  async () => {
    const pdf = createPdfRasterizer({ root, which: (c) => Bun.which(c) });
    const text = await pdf.text("docs/book.pdf");
    expect(text.kind).toBe("ok");
    const pages = text.kind === "ok" ? text.pages : [];
    expect(pages).toHaveLength(3);
    expect(pages[0]).toContain("attention please");
    expect(pages[1]?.trim()).toBe("");
    expect(pages[2]).toContain("more attention");
    const layout = await pdf.layout("docs/book.pdf", 3);
    const words =
      layout.kind === "ok"
        ? layout.layout.lines.map((l) => l.map((w) => w.text))
        : [];
    expect(words).toEqual([["Methods"], ["more", "attention"]]);
    expect(await pdf.outline("docs/book.pdf")).toEqual({
      kind: "ok",
      items: [
        { title: "Introduction", page: 1, depth: 0 },
        { title: "Methods & data", page: 3, depth: 0 },
        { title: "Sub", page: 3, depth: 1 },
      ],
    });
  },
);

test("the env given to the rasterizer reaches every Poppler run", async () => {
  const envs: unknown[] = [];
  const run: ToolRun = async (argv, o) => {
    envs.push(o.env);
    return ok(argv[0] === "/bin/pdfinfo" ? "Pages: 1\n" : PIXEL);
  };
  const env = { FONTCONFIG_FILE: "/x/fonts.conf" };
  const pdf = createPdfRasterizer({ root, which, run, env });
  await pdf.info("docs/paper.pdf");
  await pdf.page({ path: "docs/paper.pdf", page: 1, width: 256 });
  expect(envs).toEqual([env, env]);
});

test("macOS gets a font config of the system and user font folders only", async () => {
  const cache = join(root, "cache");
  expect(soCacheDir({}, "/Users/u")).toBe("/Users/u/.cache/so");
  expect(soCacheDir({ XDG_CACHE_HOME: "/c" }, "/Users/u")).toBe("/c/so");
  expect(popplerEnv("linux", "/home/u", cache)).toEqual({});
  const env = popplerEnv("darwin", "/Users/u", cache);
  const file = join(cache, "fontconfig/fonts.conf");
  expect(env).toEqual({ FONTCONFIG_FILE: file });
  const text = await Bun.file(file).text();
  expect(text).toBe(macFontConfig("/Users/u", join(cache, "fontconfig/cache")));
  expect((await stat(join(cache, "fontconfig"))).mode & 0o777).toBe(0o700);
  expect(text).toContain("<dir>/System/Library/Fonts</dir>");
  expect(text).toContain("<dir>/Users/u/Library/Fonts</dir>");
  expect(text).not.toContain("<include");
});

/** The share of pixels darker than mid grey. */
function inked({ rgba }: { rgba: Uint8Array }): number {
  let dark = 0;
  for (let i = 0; i < rgba.length; i += 4) if ((rgba[i] ?? 255) < 128) dark++;
  return dark / (rgba.length / 4);
}

test.skipIf(!poppler)(
  "text in a font the PDF leaves out still draws",
  async () => {
    await writeFile(
      join(root, "docs/helvetica.pdf"),
      makeTextPdf("Helvetica", "Hello PDF"),
    );
    const env = popplerEnv(process.platform, homedir(), join(root, "cache"));
    const pdf = createPdfRasterizer({ root, which: (c) => Bun.which(c), env });
    const page = await pdf.page({
      path: "docs/helvetica.pdf",
      page: 1,
      width: 512,
    });
    expect(inked(page)).toBeGreaterThan(0.01);
  },
  20_000,
);
