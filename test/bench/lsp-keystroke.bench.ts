// 200 keystrokes in a 5,000-line TypeScript file with a language server
// attached: the real host and client talk to the fake server, which
// publishes 200 diagnostics on every open and change. Keys arrive 10 ms
// apart; each time runs from the key's arrival, through any server message
// queued ahead of it, the store, the reducer, and a rendered frame. Prints
// {"metric":"lspKeystrokeP95","ms":<p95>} with the slowest key and the
// diagnostic batches applied while typing.
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLspHost } from "../../src/app/lsp-host";
import { parseConfig } from "../../src/core/config/toml";
import type { Action, Effect } from "../../src/core/state/types";
import { createLogger } from "../../src/workspace/log";
import { make5000LineTs } from "../fixtures/generate";
import { fakeServerConfig, killServers, lspConfig } from "../support/lsp";
import { mountShell } from "../support/ui";

const PATH = "src/big.ts";
const DIAGNOSTICS = 200;
/** The cursor starts here, so the diagnostics are on screen while typing. */
const LINE = 2500;

const ws = await mkdtemp(join(tmpdir(), "so-bench-lsp-"));
const log = join(ws, "fake.jsonl");
const diagnostics = Array.from({ length: DIAGNOSTICS }, (_, i) => ({
  range: {
    start: { line: LINE - 20 + (i % 60), character: i % 30 },
    end: { line: LINE - 20 + (i % 60), character: (i % 30) + 5 },
  },
  severity: (i % 4) + 1,
  source: "fake",
  message: `problem ${i}`,
}));
const config = lspConfig(
  true,
  fakeServerConfig({
    name: "fake",
    script: { diagnostics },
    log,
    fileTypes: ["typescript"],
  }),
);

const m = await mountShell({ cols: 120, rows: 36 });
let batches = 0;
const host = createLspHost({
  root: ws,
  dispatch: (a: Action) => {
    if (a.type === "lspDiagnostics") batches++;
    m.store.dispatch(a);
  },
  logger: createLogger({}, ws),
});
m.store.subscribe(host.observe);
/** Hands the reducer's language-server effects to the host, as the runner does. */
let forwarded = 0;
const forward = () => {
  for (; forwarded < m.effects.length; forwarded++) {
    const e = m.effects[forwarded] as Effect;
    if (
      e.kind === "lsp" ||
      e.kind === "lspCancel" ||
      e.kind === "lspReply" ||
      e.kind === "lspRestart"
    )
      host.run(e);
  }
};
/** Let queued server messages reach the store. */
const settle = () => new Promise<void>((r) => setImmediate(r));

const times: number[] = [];
try {
  m.store.dispatch({
    type: "configLoaded",
    result: parseConfig(config),
    reload: false,
  });
  m.keys("<leader>e");
  m.open(PATH, make5000LineTs());
  m.keys(`${LINE}G`);
  const until = performance.now() + 10_000;
  while ((m.store.get().lsp.shown[PATH]?.length ?? 0) < DIAGNOSTICS) {
    if (performance.now() > until)
      throw new Error("the server published no diagnostics");
    await Bun.sleep(5);
  }
  await m.frame();
  batches = 0;

  const keys = [
    ...Array.from({ length: 50 }, () => "j"),
    "o",
    ...[..."const value = step1([1, 2, 3]);".repeat(4)].slice(0, 98),
    "<Esc>",
    ...Array.from({ length: 50 }, () => "k"),
  ];
  for (const k of keys) {
    await Bun.sleep(10);
    const start = performance.now();
    await settle();
    m.keys(k);
    forward();
    await m.t.renderOnce();
    times.push(performance.now() - start);
  }
} finally {
  await host.stop();
  m.destroy();
  killServers([log]);
  await rm(ws, { recursive: true, force: true });
}
times.sort((a, b) => a - b);
const p95 = times[Math.ceil(times.length * 0.95) - 1] ?? Number.NaN;
console.log(
  JSON.stringify({
    metric: "lspKeystrokeP95",
    ms: p95,
    max: times.at(-1),
    keys: times.length,
    batches,
  }),
);
