// 200 keystrokes in the 5,000-line note in live view, the same key mix as
// the source keystroke bench, each through the store, the reducer, the
// live-preview layout, and a rendered frame. Prints
// {"metric":"liveKeystrokeP95","ms":<p95>}.
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { make5000LineNote } from "../fixtures/generate";
import { mountShell } from "../support/ui";

const dir = await mkdtemp(join(tmpdir(), "so-bench-"));
const text = await readFile(await make5000LineNote(dir), "utf8");
await rm(dir, { recursive: true });

const m = await mountShell({ cols: 120, rows: 40 });
m.keys("<leader>e");
m.open("long.md", text);
await m.frame();
if (m.store.get().buffers[1]?.view !== "live")
  throw new Error("the note did not open in live view");
m.keys("2500G");
await m.frame();

const keys = [
  ...Array.from({ length: 50 }, () => "j"),
  "o",
  ...[..."const value = step1([1, 2, 3]);".repeat(4)].slice(0, 98),
  "<Esc>",
  ...Array.from({ length: 50 }, () => "k"),
];
const times: number[] = [];
for (const k of keys) {
  const start = performance.now();
  m.keys(k);
  await m.t.renderOnce();
  times.push(performance.now() - start);
}
m.destroy();
times.sort((a, b) => a - b);
const p95 = times[Math.ceil(times.length * 0.95) - 1] ?? Number.NaN;
console.log(
  JSON.stringify({ metric: "liveKeystrokeP95", ms: p95, keys: times.length }),
);
