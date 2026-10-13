import { afterEach, beforeEach, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  fakeServerConfig,
  killServers,
  lspConfig,
  readServerLog,
  waitForMessage,
} from "../support/lsp";
import { type App, startApp, tmpWorkspace, waitFor } from "./helpers";

let app: App | undefined;
let logs: string[] = [];

beforeEach(() => {
  logs = [];
});

afterEach(async () => {
  const root = app?.root;
  await app?.stop();
  app = undefined;
  const alive = killServers(logs);
  for (const d of [root, ...logs.map(dirname)])
    if (d !== undefined) await rm(d, { recursive: true, force: true });
  expect(alive).toEqual([]);
});

const uri = (p: string) => pathToFileURL(p).href;
const range = (line: number, from: number, to: number) => ({
  start: { line, character: from },
  end: { line, character: to },
});

/**
 * A workspace with `a.ts` calling `foo` from `b.ts`, served by a fake server
 * that renames `foo` to `bar` in both files and watches every `.ts` file.
 */
async function renameSetup(): Promise<{ root: string; log: string }> {
  const root = await tmpWorkspace({
    "a.ts": "foo();\n",
    "b.ts": "export function foo() {}\n",
  });
  const log = join(await mkdtemp(join(tmpdir(), "so-lsp-")), "ts.jsonl");
  logs.push(log);
  const config = fakeServerConfig({
    name: "ts",
    fileTypes: ["typescript"],
    log,
    script: {
      capabilities: { renameProvider: true },
      registerWatchers: { globs: ["**/*.ts"] },
      responses: {
        "textDocument/rename": {
          changes: {
            [uri(join(root, "a.ts"))]: [
              { range: range(0, 0, 3), newText: "bar" },
            ],
            [uri(join(root, "b.ts"))]: [
              { range: range(0, 16, 19), newText: "bar" },
            ],
          },
        },
      },
    },
  });
  app = await startApp(root, { lsp: { config: lspConfig(true, config) } });
  await app.open("a.ts");
  await waitFor(() => app?.store.get().lsp.servers["ts@"]?.state === "ready");
  await waitForMessage(log, "response:client/registerCapability");
  return { root, log };
}

const renameToBar = (a: App) => a.keys("grn<BS><BS><BS>bar<CR>");

test("a rename over an open and a closed file writes the closed file and edits the buffer", async () => {
  const { root } = await renameSetup();
  if (app === undefined) throw new Error("app did not start");
  renameToBar(app);
  await waitFor(() => readFileSync(join(root, "b.ts"), "utf8").includes("bar"));
  expect(readFileSync(join(root, "b.ts"), "utf8")).toBe(
    "export function bar() {}\n",
  );
  expect(readFileSync(join(root, "a.ts"), "utf8")).toBe("foo();\n");
  const a = app.buffer("a.ts");
  expect(a?.text.line(0)).toBe("bar();");
  expect(a?.text.version).not.toBe(a?.savedVersion);
  await waitFor(
    () =>
      app?.store
        .get()
        .notifications.toasts.some((t) => t.text === "2 files changed") ===
      true,
  );
});

test("a closed file written by a rename is reported to watching servers", async () => {
  const { root, log } = await renameSetup();
  if (app === undefined) throw new Error("app did not start");
  renameToBar(app);
  await waitForMessage(log, "workspace/didChangeWatchedFiles");
  expect(
    readServerLog(log)
      .filter((m) => m.method === "workspace/didChangeWatchedFiles")
      .map((m) => m.params),
  ).toEqual([{ changes: [{ uri: uri(join(root, "b.ts")), type: 2 }] }]);
});
