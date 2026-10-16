import { afterAll, beforeAll, expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  rm,
  symlink,
  truncate,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { createImageLoader, fetchImage, readImage, WEB_IMAGE } from "./images";

const PNG = new Uint8Array(
  await Bun.file(
    new URL("../../test/fixtures/images/diagram.png", import.meta.url),
  ).arrayBuffer(),
);

/** Request headers the server saw, by path. */
const seen = new Map<string, Headers>();
let inFlight = 0;
let maxInFlight = 0;

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  async fetch(req) {
    const path = new URL(req.url).pathname;
    seen.set(path, req.headers);
    if (path === "/diagram.png") return new Response(PNG);
    if (path === "/huge.png")
      return new Response(new Uint8Array(WEB_IMAGE.maxBytes + 2 ** 20));
    if (path === "/huge-stream.png")
      return new Response(
        new ReadableStream({
          pull(c) {
            c.enqueue(new Uint8Array(2 ** 20));
          },
        }),
      );
    if (path === "/hang.png") return new Promise<Response>(() => {});
    if (path === "/drip.png") {
      // Headers at once, then 10 bytes every 50 ms for 2 s.
      let sent = 0;
      return new Response(
        new ReadableStream({
          async pull(c) {
            await Bun.sleep(50);
            if (++sent > 40) c.close();
            else c.enqueue(new Uint8Array(10));
          },
        }),
      );
    }
    if (path.startsWith("/slow/")) {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Bun.sleep(50);
      inFlight--;
      return new Response(PNG);
    }
    return new Response("not found", { status: 404 });
  },
});
const url = (path: string) => `http://127.0.0.1:${server.port}${path}`;

let root = "";
let outside = "";
beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "so-images-"));
  outside = await mkdtemp(join(tmpdir(), "so-outside-"));
  await mkdir(join(root, "images"));
  await writeFile(join(root, "images/diagram.png"), PNG);
  await writeFile(join(outside, "secret.png"), PNG);
  await symlink(join(outside, "secret.png"), join(root, "images/link.png"));
  await writeFile(join(root, "images/huge.png"), "");
  await truncate(join(root, "images/huge.png"), 32 * 2 ** 20 + 1);
});
afterAll(async () => {
  server.stop(true);
  await rm(root, { recursive: true, force: true });
  await rm(outside, { recursive: true, force: true });
});

test("web image downloads return the bytes and send no cookie or referrer", async () => {
  expect(await fetchImage(url("/diagram.png"))).toEqual(PNG);
  const headers = seen.get("/diagram.png");
  expect(headers?.get("cookie")).toBeNull();
  expect(headers?.get("referer")).toBeNull();
});

test("web image downloads are capped, time out, and reject errors and other schemes", async () => {
  await expect(fetchImage(url("/huge.png"))).rejects.toThrow("too large");
  await expect(fetchImage(url("/huge-stream.png"))).rejects.toThrow(
    "too large",
  );
  await expect(fetchImage(url("/missing.png"))).rejects.toThrow("HTTP 404");
  await expect(
    fetchImage(url("/hang.png"), { timeoutMs: 200 }),
  ).rejects.toThrow();
  await expect(fetchImage("ftp://x/a.png")).rejects.toThrow("not a web image");
});

test("the download timeout covers a body that arrives too slowly", async () => {
  const start = performance.now();
  await expect(
    fetchImage(url("/drip.png"), { timeoutMs: 300 }),
  ).rejects.toThrow();
  expect(performance.now() - start).toBeLessThan(1_000);
});

test("at most four web images download at once", async () => {
  const load = createImageLoader(root);
  const all = await Promise.all(
    Array.from({ length: 6 }, (_, i) => load(url(`/slow/${i}.png`))),
  );
  expect(all).toHaveLength(6);
  for (const bytes of all) expect(bytes).toEqual(PNG);
  expect(maxInFlight).toBe(WEB_IMAGE.maxInFlight);
});

test("workspace images are read from disk without a request", async () => {
  let requests = 0;
  const load = createImageLoader(root, {
    fetch: (() => {
      requests++;
      return Promise.reject(new Error("no network"));
    }) as unknown as typeof fetch,
  });
  expect(await load("images/diagram.png")).toEqual(PNG);
  expect(requests).toBe(0);
});

test("workspace image reads stay inside the workspace and under 32 MiB", async () => {
  expect(await readImage(root, "images/diagram.png")).toEqual(PNG);
  await expect(
    readImage(root, join("..", basename(outside), "secret.png")),
  ).rejects.toThrow("outside the workspace");
  await expect(readImage(root, "images/link.png")).rejects.toThrow(
    "outside the workspace",
  );
  await expect(readImage(root, "images/huge.png")).rejects.toThrow("too large");
  await expect(readImage(root, "images/none.png")).rejects.toThrow();
});

const PAGE = { rgba: new Uint8Array([7, 7, 7, 255]), width: 1, height: 1 };

test("a PDF page reference draws through the PDF renderer", async () => {
  const asked: unknown[] = [];
  const load = createImageLoader(root, {
    pdfPage: async (r) => {
      asked.push(r);
      return PAGE;
    },
  });
  expect(await load("docs/paper.pdf#page=3")).toBe(PAGE);
  expect(asked).toEqual([{ path: "docs/paper.pdf", page: 3, width: 1024 }]);
  await expect(createImageLoader(root)("a.pdf#page=1")).rejects.toThrow(
    "no PDF renderer",
  );
});

test("an SVG file is drawn through the SVG rasterizer at its own crop", async () => {
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='10 0 40 20'/>";
  await writeFile(join(root, "images/logo.svg"), svg);
  await writeFile(join(root, "images/not.svg"), "<html></html>");
  const asked: unknown[] = [];
  const load = createImageLoader(root, {
    svg: async (r) => {
      asked.push(r);
      return PAGE;
    },
  });
  expect(await load("images/logo.svg")).toBe(PAGE);
  expect(asked).toEqual([
    {
      svg,
      background: "transparent",
      crop: { x: 10, y: 0, w: 40, h: 20 },
      width: 2048,
      height: 1024,
    },
  ]);
  await expect(load("images/not.svg")).rejects.toThrow("not an SVG drawing");
  // Without a rasterizer the bytes pass through, as for any other image.
  expect(await createImageLoader(root)("images/logo.svg")).toBeInstanceOf(
    Uint8Array,
  );
});
