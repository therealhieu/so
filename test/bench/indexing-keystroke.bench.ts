// 200 keystrokes in a note while the real index worker scans 10,000
// generated notes. Each time runs from the key's arrival, through any index
// batch queued ahead of it, the store, the reducer, and a rendered frame.
// Prints {"metric":"indexingKeystrokeP95","ms":<p95>}.
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createIndexHost } from "../../src/app/index-host";
import { createLogger } from "../../src/workspace/log";
import { makeNoteWorkspace, notePath } from "../fixtures/generate";
import { mountShell } from "../support/ui";

const KEYS = 200;

const ws = await mkdtemp(join(tmpdir(), "so-bench-indexing-"));
await makeNoteWorkspace(ws);
const note = notePath(0);
const text = await readFile(join(ws, note), "utf8");

const m = await mountShell({ cols: 120, rows: 36 });
m.open(note, text);
await m.frame();
const host = createIndexHost({
  dispatch: (a) => m.store.dispatch(a),
  logger: createLogger({}, ws),
});
const indexing = () => m.store.get().index.status === "indexing";
/** Let queued worker messages reach the store. */
const settle = () => new Promise<void>((r) => setImmediate(r));

host.start(ws, []);
while (!indexing()) await Bun.sleep(1);

const keys = [
  "G",
  "o",
  ...[..."Typing while the index scans [[note-00042]] #idea. ".repeat(4)].slice(
    0,
    KEYS - 4,
  ),
  "<Esc>",
  "k",
];
const times: number[] = [];
try {
  for (const k of keys) {
    if (!indexing())
      throw new Error(`indexing finished after ${times.length} keys`);
    const start = performance.now();
    await settle();
    m.keys(k);
    await m.t.renderOnce();
    times.push(performance.now() - start);
  }
} finally {
  host.stop();
  m.destroy();
  await rm(ws, { recursive: true, force: true });
}
times.sort((a, b) => a - b);
const p95 = times[Math.ceil(times.length * 0.95) - 1] ?? Number.NaN;
console.log(
  JSON.stringify({
    metric: "indexingKeystrokeP95",
    ms: p95,
    keys: times.length,
  }),
);
