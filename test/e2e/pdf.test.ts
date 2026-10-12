import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeBookPdf, makePdf, makeTextPdf } from "../support/pdf";
import { ready, runInPty, statusRow } from "./pty";

const MAIN = join(import.meta.dir, "../../src/app/main.ts");

let root = "";
let emptyPath = "";

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "so-pdf-e2e-"));
  emptyPath = await mkdtemp(join(tmpdir(), "so-no-poppler-"));
  await writeFile(join(root, "paper.pdf"), makePdf(2));
  await writeFile(
    join(root, "book.pdf"),
    makeBookPdf([["Intro"], ["Nothing"], ["the attention part"]]),
  );
  await writeFile(
    join(root, "hello.pdf"),
    makeTextPdf("Helvetica", "Hello brave world"),
  );
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
  await rm(emptyPath, { recursive: true, force: true });
});

const poppler = Bun.which("pdftoppm") !== null && Bun.which("pdfinfo") !== null;

test.skipIf(!poppler)(
  "so paper.pdf shows its pages in the terminal and pages through them",
  async () => {
    const r = await runInPty(
      [process.execPath, MAIN, join(root, "paper.pdf")],
      {
        async script(p) {
          await ready(p);
          await p.waitFor(() => statusRow(p).includes(" 1/2 "), 10_000);
          expect(statusRow(p)).toContain("PDF");
          p.type("J");
          await p.waitFor(() => statusRow(p).includes(" 2/2 "));
          p.type(":q\r");
        },
      },
    );
    expect(r.exitCode).toBe(0);
    expect(r.screen.text).not.toContain("binary file");
  },
  30_000,
);

test("without Poppler on PATH a PDF opens with the install hint", async () => {
  const r = await runInPty([process.execPath, MAIN, join(root, "paper.pdf")], {
    env: { PATH: emptyPath },
    async script(p) {
      await ready(p);
      await p.waitFor(
        () => p.screen().includes("PDF view needs Poppler"),
        10_000,
      );
      expect(statusRow(p)).toContain(" 1/? ");
      p.type(":q\r");
    },
  });
  expect(r.exitCode).toBe(0);
}, 30_000);

test.skipIf(!poppler || Bun.which("pdftotext") === null)(
  "/ finds the page with a hit and the statusline counts it",
  async () => {
    const r = await runInPty([process.execPath, MAIN, join(root, "book.pdf")], {
      async script(p) {
        await ready(p);
        await p.waitFor(() => statusRow(p).includes(" 1/3 "), 10_000);
        p.type("/attention\r");
        await p.waitFor(() => statusRow(p).includes(" 3/3 "), 10_000);
        expect(statusRow(p)).toContain("[1/1]");
        p.type(":q\r");
      },
    });
    expect(r.exitCode).toBe(0);
  },
  30_000,
);

const ESC = "\x1b";

test.skipIf(!poppler || Bun.which("pdftotext") === null)(
  "a drag across the page and y copy its text",
  async () => {
    const r = await runInPty(
      [process.execPath, MAIN, join(root, "hello.pdf")],
      {
        async script(p) {
          await ready(p);
          await p.waitFor(() => statusRow(p).includes(" 1/1 "), 10_000);
          await p.waitFor(() => !p.screen().includes("◌ hello.pdf"), 10_000);
          // The page has one line, so any drag on it ends on that line's words.
          p.type(`${ESC}[<0;10;6M${ESC}[<32;70;6M${ESC}[<0;70;6m`);
          // y says it is still reading the page's words until they arrive.
          await p.waitFor(() => {
            if (p.screen().includes("copied 1 line")) return true;
            p.type("y");
            return false;
          }, 10_000);
          p.type(":q\r");
        },
      },
    );
    expect(r.exitCode).toBe(0);
  },
  30_000,
);

test.skipIf(!poppler || Bun.which("pdftotext") === null)(
  "letting go of a drag offers its actions; h saves a highlight beside the workspace",
  async () => {
    const r = await runInPty(
      [process.execPath, MAIN, join(root, "hello.pdf")],
      {
        async script(p) {
          await ready(p);
          await p.waitFor(() => statusRow(p).includes(" 1/1 "), 10_000);
          await p.waitFor(() => !p.screen().includes("◌ hello.pdf"), 10_000);
          // The float opens once the page's words are in; until then, drag again.
          await p.waitFor(() => {
            if (p.screen().includes("h Highlight")) return true;
            p.type(`${ESC}[<0;10;6M${ESC}[<32;70;6M${ESC}[<0;70;6m`);
            return false;
          }, 10_000);
          p.type("h");
          await p.waitFor(() => p.screen().includes("highlighted"), 5_000);
          p.type(":q\r");
        },
      },
    );
    expect(r.exitCode).toBe(0);
    const file = JSON.parse(
      await Bun.file(join(root, ".so/annotations/hello.pdf.json")).text(),
    );
    expect(file).toMatchObject({ version: 1, file: "hello.pdf" });
    expect(file.items).toHaveLength(1);
    expect(file.items[0]).toMatchObject({ kind: "highlight", page: 1 });
    expect(file.items[0].quote).toContain("brave");
  },
  30_000,
);
