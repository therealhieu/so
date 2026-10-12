import { afterEach, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDF_MISSING, pdfWindow } from "../../src/core/state/pdf";
import { makeBookPdf, makePdf, makeTextPdf } from "../support/pdf";
import { type App, startApp, tmpWorkspace, waitFor } from "./helpers";

let app: App | undefined;
afterEach(async () => {
  if (app === undefined) return;
  await app.stop();
  await rm(app.root, { recursive: true, force: true });
  app = undefined;
});

async function withPaper(
  opts: Parameters<typeof startApp>[1] = {},
): Promise<App> {
  const root = await tmpWorkspace();
  await writeFile(join(root, "paper.pdf"), makePdf(2));
  return startApp(root, opts);
}

const poppler = Bun.which("pdftoppm") !== null && Bun.which("pdfinfo") !== null;

test.skipIf(!poppler)(
  "a PDF opens as a read-only buffer and Poppler counts its pages",
  async () => {
    app = await withPaper();
    const b = await app.open("paper.pdf");
    expect(b).toMatchObject({ fileType: "pdf", readOnly: true, binary: true });
    const a = app;
    await waitFor(() => a.buffer("paper.pdf")?.pdf?.status === "ready");
    expect(a.buffer("paper.pdf")?.pdf).toMatchObject({ pages: 2 });
    expect(a.store.get().notifications.message).toBeUndefined();
    a.keys("<Esc>:w<CR>");
    expect(a.effects.filter((e) => e.kind === "write")).toEqual([]);
  },
);

test("without Poppler a PDF still opens and says how to view it", async () => {
  app = await withPaper({ pdfWhich: () => null });
  await app.open("paper.pdf");
  const a = app;
  await waitFor(() => a.buffer("paper.pdf")?.pdf?.status === "missing");
  expect(a.store.get().notifications.message).toEqual({
    text: PDF_MISSING,
    level: "error",
  });
});

test.skipIf(!poppler)("a PDF changed on disk is counted again", async () => {
  app = await withPaper();
  await app.open("paper.pdf");
  const a = app;
  await waitFor(() => a.buffer("paper.pdf")?.pdf?.status === "ready");
  await writeFile(join(a.root, "paper.pdf"), makePdf(5));
  await waitFor(() => {
    const pdf = a.buffer("paper.pdf")?.pdf;
    return pdf?.status === "ready" && pdf.pages === 5;
  });
});

const tools =
  Bun.which("pdftotext") !== null && Bun.which("pdftohtml") !== null;

test.skipIf(!poppler || !tools)(
  "search and contents read a real PDF's text and outline",
  async () => {
    const root = await tmpWorkspace();
    await writeFile(
      join(root, "book.pdf"),
      makeBookPdf(
        [["Intro"], ["Nothing to see"], ["Methods", "the attention part"]],
        [
          { title: "Introduction", page: 1 },
          { title: "Methods", page: 3 },
        ],
      ),
    );
    app = await startApp(root);
    await app.open("book.pdf");
    const a = app;
    const page = () => {
      const s = a.store.get();
      return pdfWindow(s, s.windows.active)?.page;
    };
    await waitFor(() => a.buffer("book.pdf")?.pdf?.status === "ready");
    a.keys("/attention<CR>");
    await waitFor(() => page() === 3);
    expect(a.store.get().notifications.message?.text).toBe(
      '"attention": page 3 · 1 hit',
    );
    a.keys("gg<leader>po");
    await waitFor(() => a.buffer("book.pdf")?.pdfOutline?.status === "ready");
    const o = a.store.get().overlay;
    expect(
      o.kind === "picker" ? o.picker.items.map((i) => i.label) : [],
    ).toEqual(["Introduction", "Methods"]);
    a.keys("meth<CR>");
    expect(page()).toBe(3);
  },
);

test.skipIf(!poppler || !tools)(
  "a drag over a real PDF's text copies its characters with y",
  async () => {
    const root = await tmpWorkspace();
    // A 400×200 pt page; the words sit between y 45 and 90.
    await writeFile(
      join(root, "hello.pdf"),
      makeTextPdf("Helvetica", "Hello brave world"),
    );
    app = await startApp(root);
    await app.open("hello.pdf");
    const a = app;
    await waitFor(() => a.buffer("hello.pdf")?.pdf?.status === "ready");
    const window = a.store.get().windows.active;
    const on = (x: number) => ({
      kind: "window" as const,
      window,
      spot: { kind: "pdf" as const, at: { x: x / 400, y: 0.33 } },
    });
    a.store.dispatch({
      type: "mouse",
      event: { kind: "press", target: on(200), clicks: 1, ctrl: false },
      now: 0,
    });
    a.store.dispatch({
      type: "mouse",
      event: { kind: "drag", target: on(330) },
      now: 0,
    });
    await waitFor(
      () => a.buffer("hello.pdf")?.pdfLayout?.[1]?.status === "ready",
    );
    a.keys("y");
    // From the middle of "brave" to the middle of "world".
    expect(a.store.get().vim.registers.get('"')?.text).toBe("ve wo");
    expect(a.effects).toContainEqual({ kind: "clipboardWrite", text: "ve wo" });
    // From the left edge of "brave" past the end of "world".
    for (const event of [
      { kind: "press", target: on(142), clicks: 1, ctrl: false },
      { kind: "drag", target: on(395) },
    ] as const)
      a.store.dispatch({ type: "mouse", event, now: 0 });
    a.keys("y");
    expect(a.store.get().vim.registers.get('"')?.text).toBe("brave world");
  },
);

test("a PDF's saved annotations load when it opens, and follow it when renamed", async () => {
  app = await withPaper({ pdfWhich: () => null });
  const saved = {
    version: 1,
    file: "paper.pdf",
    items: [
      {
        id: "a1",
        kind: "note" as const,
        page: 1,
        anchor: { x: 0.1, y: 0.1 },
        head: { x: 0.5, y: 0.1 },
        quote: "Hello",
        note: "read this first",
        created: "2026-10-12T09:00:00.000Z",
      },
    ],
  };
  await Bun.write(
    join(app.root, ".so/annotations/paper.pdf.json"),
    JSON.stringify(saved),
  );
  await app.open("paper.pdf");
  const a = app;
  await waitFor(
    () => a.store.get().annotations["paper.pdf"]?.status === "ready",
  );
  expect(a.store.get().annotations["paper.pdf"]).toEqual({
    status: "ready",
    items: saved.items,
  });
  a.store.dispatch({
    type: "fsResult",
    op: { kind: "rename", from: "paper.pdf", to: "renamed.pdf" },
    ok: true,
  });
  const moved = join(a.root, ".so/annotations/renamed.pdf.json");
  await waitFor(() => existsSync(moved));
  expect(JSON.parse(await Bun.file(moved).text()).items).toEqual(saved.items);
});
