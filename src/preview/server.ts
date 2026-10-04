import { readFileSync, realpathSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { createTextBuffer } from "../core/kernel/text/text-buffer";
import { parseDoc } from "../core/lang/markdown/doc";
import { renderHtml } from "../core/lang/markdown/html";
import {
  type FollowTarget,
  followTarget,
  htmlCtx,
  openNote,
} from "../core/state/preview";
import type { Store } from "../core/state/store";
import { ASSETS, PAGE, type PreviewAsset } from "./assets";

/** Scripts, fonts, and connections from this server only; inline styles for diagrams; images also from the web. */
export const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; " +
    "img-src 'self' data: http: https:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
} as const;

/** A workspace file opened directly gets an opaque origin and no script. */
export const FILE_CSP =
  "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox";

export type PreviewServerOptions = {
  root: string;
  store: Store;
  /** The workspace's exclusion rule for a relative path. */
  isExcluded(rel: string): boolean;
  port?: number;
};
export type PreviewServer = { port: number; stop(): void };

/** How long the server lets edits settle before it tells pages about them. */
const FOLLOW_DELAY_MS = 100;
const MARKDOWN = /\.md$/i;

const respond = (
  body: BodyInit | null,
  status: number,
  headers: Record<string, string> = {},
) =>
  new Response(body, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...SECURITY_HEADERS,
      ...headers,
    },
  });

const notFound = () => respond("not found", 404);

const serveAsset = (a: PreviewAsset | undefined) =>
  a === undefined
    ? notFound()
    : respond(Bun.file(a.path), 200, {
        "Content-Type": a.type,
        "Cache-Control": "no-cache",
      });

/**
 * The read-only preview: the page, its embedded assets, rendered notes,
 * contained workspace files, and server-sent `doc` events that follow the
 * active note. It listens on 127.0.0.1 only and answers GET only.
 */
export function startPreviewServer(o: PreviewServerOptions): PreviewServer {
  const rootReal = realpathSync(o.root);
  const encoder = new TextEncoder();
  const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();
  let last: FollowTarget | undefined = followTarget(o.store.get());

  const send = (event: "doc" | "stopped", data: unknown) => {
    const chunk = encoder.encode(
      `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
    );
    for (const c of clients) {
      try {
        c.enqueue(chunk);
      } catch {
        clients.delete(c);
      }
    }
  };

  /** A workspace-relative path with no empty, dot, or hidden segment that the workspace does not exclude. */
  const visible = (rel: string) =>
    rel !== "" &&
    !rel.split("/").some((p) => p === "" || p.startsWith(".")) &&
    !o.isExcluded(rel);

  /** The real path of a visible file that stays inside the workspace after symlinks. */
  const contained = (rel: string): string | undefined => {
    if (rel.includes("\\") || rel.includes("\0") || !visible(rel))
      return undefined;
    let real: string;
    try {
      real = realpathSync(join(rootReal, rel));
    } catch {
      return undefined;
    }
    if (!real.startsWith(rootReal + sep)) return undefined;
    const inside = relative(rootReal, real).split(sep).join("/");
    return visible(inside) ? real : undefined;
  };

  const readNote = (rel: string) => {
    const abs = MARKDOWN.test(rel) ? contained(rel) : undefined;
    if (abs === undefined) return undefined;
    try {
      const text = createTextBuffer(
        readFileSync(abs, "utf8")
          .replace(/^\uFEFF/, "")
          .replace(/\r\n/g, "\n"),
      );
      return { doc: parseDoc(text), text };
    } catch {
      return undefined;
    }
  };

  const render = (path: string | null) => {
    const s = o.store.get();
    const rel = path ?? last?.path;
    if (rel === undefined) return notFound();
    if (!MARKDOWN.test(rel) || !visible(rel)) return notFound();
    const got = openNote(s, rel) ?? readNote(rel);
    if (got === undefined) return notFound();
    const html = renderHtml(got.doc, got.text, htmlCtx(s, rel, readNote));
    return respond(html, 200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
  };

  const file = (encoded: string) => {
    let rel: string;
    try {
      rel = decodeURIComponent(encoded);
    } catch {
      return notFound();
    }
    const abs = contained(rel);
    if (abs === undefined) return notFound();
    try {
      if (!statSync(abs).isFile()) return notFound();
    } catch {
      return notFound();
    }
    const body = Bun.file(abs);
    return respond(body, 200, {
      "Content-Type": body.type,
      "Content-Security-Policy": FILE_CSP,
    });
  };

  const events = () => {
    let self: ReadableStreamDefaultController<Uint8Array> | undefined;
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        self = c;
        clients.add(c);
        c.enqueue(encoder.encode(": connected\n\n"));
      },
      cancel() {
        if (self !== undefined) clients.delete(self);
      },
    });
    return respond(stream, 200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    });
  };

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: o.port ?? 0,
    idleTimeout: 0,
    fetch(req) {
      const host = req.headers.get("host");
      if (
        host !== `127.0.0.1:${server.port}` &&
        host !== `localhost:${server.port}`
      )
        return respond("forbidden", 403);
      if (req.method !== "GET") return respond("method not allowed", 405);
      const url = new URL(req.url);
      if (url.pathname === "/events") return events();
      if (url.pathname === "/render")
        return render(url.searchParams.get("path"));
      if (url.pathname.startsWith("/assets/"))
        return serveAsset(ASSETS.get(url.pathname.slice("/assets/".length)));
      if (url.pathname.startsWith("/file/"))
        return file(url.pathname.slice("/file/".length));
      return serveAsset(PAGE);
    },
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const check = () => {
    timer = undefined;
    const t = followTarget(o.store.get()) ?? last;
    if (
      t === undefined ||
      (t.path === last?.path &&
        t.version === last.version &&
        t.line === last.line)
    )
      return;
    last = t;
    send("doc", { path: t.path, version: t.version, line: t.line });
  };
  const unsubscribe = o.store.subscribe(() => {
    timer ??= setTimeout(check, FOLLOW_DELAY_MS);
  });

  return {
    port: server.port as number,
    stop() {
      unsubscribe();
      clearTimeout(timer);
      send("stopped", {});
      for (const c of clients) {
        try {
          c.close();
        } catch {}
      }
      clients.clear();
      // Graceful: the closed streams finish delivering `stopped`; new connections are refused at once.
      void server.stop();
    },
  };
}
