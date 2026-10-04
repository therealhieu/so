import { afterEach, expect, test } from "bun:test";
import { readFileSync, symlinkSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { join } from "node:path";
import {
  FILE_CSP,
  type PreviewServer,
  SECURITY_HEADERS,
  startPreviewServer,
} from "../../src/preview/server";
import { createExclusionMatcher } from "../../src/workspace/ignore";
import { type App, startApp, tmpWorkspace } from "./helpers";

const FILES = {
  "notes/plan.md": "# Plan\n\nFirst line.\n",
  "notes/closed.md": "# Closed\n\nRead from disk.\n",
  "scripts/sync.ts": "export const sync = 1;\n",
  ".git/config": "[core]\n",
  ".gitignore": "ignored.md\n",
  "ignored.md": "# Secret\n",
  "diagram.svg":
    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>\n',
};

type Running = { app: App; server: PreviewServer; url(path: string): string };
let running: Running | undefined;

afterEach(() => {
  running?.server.stop();
  running?.app.stop();
  running = undefined;
});

/** A workspace with `notes/plan.md` open and the preview server following it. */
async function serve(): Promise<Running> {
  const root = await tmpWorkspace(FILES);
  symlinkSync("/etc", join(root, "link-out"));
  const app = await startApp(root);
  await app.open("notes/plan.md");
  const matcher = createExclusionMatcher(root, (p) => {
    try {
      return readFileSync(p, "utf8");
    } catch {
      return null;
    }
  });
  const server = startPreviewServer({
    root,
    store: app.store,
    isExcluded: matcher.isExcludedPath,
  });
  running = {
    app,
    server,
    url: (path) => `http://127.0.0.1:${server.port}${path}`,
  };
  return running;
}

type SseEvent = { event: string; data: string; at: number };

/** A connected `/events` client collecting every event it reads. */
async function listen(url: string) {
  const res = await fetch(url);
  const reader = (res.body as ReadableStream<Uint8Array>).getReader();
  const got: SseEvent[] = [];
  let ended = false;
  const decoder = new TextDecoder();
  let pending = "";
  const done = (async () => {
    for (;;) {
      const { done, value } = await reader.read().catch(() => ({
        done: true as const,
        value: undefined,
      }));
      if (done) {
        ended = true;
        return;
      }
      pending += decoder.decode(value, { stream: true });
      for (let i = pending.indexOf("\n\n"); i !== -1; ) {
        const chunk = pending.slice(0, i);
        pending = pending.slice(i + 2);
        const event = /^event: (.*)$/m.exec(chunk)?.[1];
        if (event !== undefined)
          got.push({
            event,
            data: /^data: (.*)$/m.exec(chunk)?.[1] ?? "",
            at: performance.now(),
          });
        i = pending.indexOf("\n\n");
      }
    }
  })();
  return {
    res,
    got,
    done,
    ended: () => ended,
    close: () => reader.cancel().catch(() => {}),
  };
}

/** The status of a raw request, so the Host header is exactly what is sent. */
function rawStatus(
  port: number,
  host: string,
  method = "GET",
  path = "/",
): Promise<number> {
  return new Promise((resolve, reject) => {
    let text = "";
    Bun.connect({
      hostname: "127.0.0.1",
      port,
      socket: {
        open(s) {
          s.write(
            `${method} ${path} HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`,
          );
        },
        data(s, d) {
          text += d.toString();
          const m = /^HTTP\/1\.1 (\d{3})/.exec(text);
          if (m) {
            resolve(Number(m[1]));
            s.end();
          }
        },
        error(_s, e) {
          reject(e);
        },
      },
    }).catch(reject);
  });
}

const waitUntil = async (pred: () => boolean, ms: number) => {
  const until = performance.now() + ms;
  while (!pred() && performance.now() < until) await Bun.sleep(5);
  return pred();
};

test("requests with a foreign host are refused", async () => {
  const { server } = await serve();
  expect(await rawStatus(server.port, `evil.test:${server.port}`)).toBe(403);
  expect(await rawStatus(server.port, `127.0.0.1:${server.port}`)).toBe(200);
  expect(await rawStatus(server.port, `localhost:${server.port}`)).toBe(200);
});

test("paths outside the workspace or hidden or ignored are not found", async () => {
  const { url } = await serve();
  for (const path of [
    "/file/..%2f..%2fetc/passwd",
    "/file/link-out/passwd",
    "/file/.git/config",
    "/file/ignored.md",
    "/render?path=../x.md",
    "/render?path=ignored.md",
    "/render?path=scripts/sync.ts",
  ])
    expect([path, (await fetch(url(path))).status]).toEqual([path, 404]);
  expect((await fetch(url("/file/notes/plan.md"))).status).toBe(200);
});

test("only GET is answered, on the loopback address only", async () => {
  const { server, url } = await serve();
  expect((await fetch(url("/render"), { method: "POST" })).status).toBe(405);
  expect(await rawStatus(server.port, `127.0.0.1:${server.port}`, "PUT")).toBe(
    405,
  );
  const others = Object.values(networkInterfaces())
    .flat()
    .filter((a) => a !== undefined && !a.internal && a.family === "IPv4")
    .map((a) => a?.address as string);
  for (const host of [...others, "[::1]"])
    await expect(
      fetch(`http://${host}:${server.port}/`).then((r) => r.status),
    ).rejects.toThrow();
});

test("an edit reaches the page within 300 ms", async () => {
  const { app, url } = await serve();
  const events = await listen(url("/events"));
  const before = app.buffer("notes/plan.md")?.text.version as number;
  const start = performance.now();
  app.keys("ggA edited<Esc>");
  const arrived = await waitUntil(
    () => events.got.some((e) => e.event === "doc"),
    1000,
  );
  expect(arrived).toBe(true);
  const doc = events.got.find((e) => e.event === "doc") as SseEvent;
  expect(doc.at - start).toBeLessThan(300);
  const payload = JSON.parse(doc.data);
  expect(payload).toEqual({
    path: "notes/plan.md",
    version: expect.any(Number),
    line: 0,
  });
  expect(payload.version).toBeGreaterThan(before);
  const html = await (await fetch(url("/render"))).text();
  expect(html).toContain("<h1>Plan edited</h1>");
  expect(html).toMatch(/^<section data-line="0"/);
  events.close();
});

test("a code file leaves the page on the last note", async () => {
  const { app, url } = await serve();
  const events = await listen(url("/events"));
  await app.open("scripts/sync.ts");
  await Bun.sleep(300);
  expect(events.got.filter((e) => e.event === "doc")).toEqual([]);
  const html = await (await fetch(url("/render"))).text();
  expect(html).toContain("First line.");
  events.close();
});

test("a closed note is rendered from disk", async () => {
  const { url } = await serve();
  const res = await fetch(url("/render?path=notes/closed.md"));
  expect(res.status).toBe(200);
  expect(await res.text()).toContain("<p>Read from disk.</p>");
});

test("stopping tells connected pages before closing", async () => {
  const { server, url } = await serve();
  const events = await listen(url("/events"));
  server.stop();
  await events.done;
  expect(events.ended()).toBe(true);
  expect(events.got.at(-1)?.event).toBe("stopped");
  await expect(fetch(url("/"))).rejects.toThrow();
});

test("every response carries the same-origin security policy", async () => {
  const { url } = await serve();
  const policy = SECURITY_HEADERS["Content-Security-Policy"];
  expect(policy).toContain("img-src 'self' data: http: https:");
  for (const d of ["script-src", "font-src", "connect-src"])
    expect(policy).toContain(`${d} 'self';`);

  const page = await fetch(url("/notes/plan.md"));
  expect(page.status).toBe(200);
  expect(page.headers.get("content-type")).toBe("text/html; charset=utf-8");
  expect(await page.text()).not.toMatch(/<form|contenteditable/);

  const katex = await fetch(url("/assets/katex.min.js"));
  expect(katex.status).toBe(200);
  expect(katex.headers.get("content-type")).toBe(
    "text/javascript; charset=utf-8",
  );
  expect(new Uint8Array(await katex.arrayBuffer())).toEqual(
    new Uint8Array(readFileSync("node_modules/katex/dist/katex.min.js")),
  );

  const missing = await fetch(url("/assets/nope.js"));
  expect(missing.status).toBe(404);

  for (const res of [page, katex, missing]) {
    expect(res.headers.get("content-security-policy")).toBe(policy);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
  }
  expect(page.headers.get("cache-control")).toBe("no-cache");
  expect(katex.headers.get("cache-control")).toBe("no-cache");

  const svg = await fetch(url("/file/diagram.svg"));
  expect(svg.status).toBe(200);
  expect(svg.headers.get("content-security-policy")).toBe(FILE_CSP);
  expect(FILE_CSP).toContain("sandbox");
  expect(svg.headers.get("x-content-type-options")).toBe("nosniff");

  const refused = await fetch(url("/file/.git/config"));
  expect(refused.headers.get("content-security-policy")).toBe(policy);
});
