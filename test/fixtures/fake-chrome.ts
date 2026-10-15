/**
 * A headless Chrome stand-in for tests, run as
 * `bun test/fixtures/fake-chrome.ts <log.jsonl> <mode> [chrome switches]`.
 * It speaks the DevTools Protocol over the pipe Chrome uses (calls on fd 3,
 * answers and events on fd 4, each message ending in a NUL), appends every
 * call to the log as one JSON line (the first line holds its argv and pid),
 * and exits when the pipe closes, as Chrome does.
 *
 * Modes: `ok` shows any page as one frame and a title; `crash` exits after
 * the first frame is acknowledged; `fail` writes an error and exits at once.
 */
import { appendFileSync, createReadStream, writeSync } from "node:fs";

const [log = "/dev/null", mode = "ok"] = process.argv.slice(2);
const record = (v: unknown) => appendFileSync(log, `${JSON.stringify(v)}\n`);
record({ argv: process.argv.slice(4), pid: process.pid });

if (mode === "fail") {
  process.stderr.write("[0101/000000.000:ERROR:fake] no display to open\n");
  process.exit(1);
}

/** A 1×1 PNG. */
const FRAME =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const SESSION = "S1";
const MAIN = "F1";

const out = (m: unknown) => writeSync(4, `${JSON.stringify(m)}\0`);
const event = (method: string, params: Record<string, unknown>) =>
  out({ method, params, sessionId: SESSION });
let frames = 0;
const frame = () =>
  event("Page.screencastFrame", {
    data: FRAME,
    sessionId: ++frames,
    metadata: {},
  });

/** What a call answers, and what it sends after. */
function answer(
  method: string,
  params: Record<string, unknown>,
): { result: unknown; after?: () => void } {
  switch (method) {
    case "Browser.getVersion":
      return { result: { product: "FakeChrome/1" } };
    case "Target.createTarget":
      return { result: { targetId: "T1" } };
    case "Target.attachToTarget":
      return { result: { sessionId: SESSION } };
    case "Page.getFrameTree":
      return {
        result: { frameTree: { frame: { id: MAIN, url: "about:blank" } } },
      };
    case "Page.startScreencast":
      return { result: {}, after: frame };
    case "Page.navigate":
      return {
        result: { frameId: MAIN },
        after: () => {
          event("Page.frameStartedLoading", { frameId: MAIN });
          event("Page.frameNavigated", {
            frame: { id: MAIN, url: params.url },
          });
          event("Page.frameStoppedLoading", { frameId: MAIN });
          frame();
        },
      };
    case "Page.screencastFrameAck":
      return {
        result: {},
        after: () => {
          if (mode === "crash") process.exit(1);
        },
      };
    case "Runtime.evaluate": {
      const e = String(params.expression);
      if (e === "document.title")
        return { result: { result: { value: "Fake page" } } };
      if (e.includes("getSelection"))
        return { result: { result: { value: "fake selection" } } };
      return { result: { result: { value: false } } };
    }
    default:
      return { result: {} };
  }
}

let parts: Buffer[] = [];
const input = createReadStream("", { fd: 3 });
input.on("data", (chunk: Buffer | string) => {
  let rest = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
  let at = rest.indexOf(0);
  while (at >= 0) {
    parts.push(rest.subarray(0, at));
    const m = JSON.parse(Buffer.concat(parts).toString("utf8")) as {
      id: number;
      method: string;
      params?: Record<string, unknown>;
      sessionId?: string;
    };
    parts = [];
    rest = rest.subarray(at + 1);
    at = rest.indexOf(0);
    record({ method: m.method, params: m.params ?? {} });
    const a = answer(m.method, m.params ?? {});
    out({
      id: m.id,
      result: a.result,
      ...(m.sessionId === undefined ? {} : { sessionId: m.sessionId }),
    });
    a.after?.();
  }
  if (rest.length > 0) parts.push(rest);
});
input.on("close", () => process.exit(0));
