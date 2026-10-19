// Scrolling the 5,000-line note in live view (--file note) or the 5,000-line
// TypeScript file in source view (--file ts): `j` held for 2 s at a 30 Hz key
// repeat, then 40 `<C-d>` and 40 `<C-u>`. Each frame is timed from the key
// to the end of its render. Prints
// {"metric":"liveScrollFrameP95"|"sourceScrollFrameP95","ms":<p95>}.
// With --zoom Z, the note scrolls in reading view at text zoom Z on a
// terminal that sizes text, and the metric is "zoomScrollFrameP95".
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { createTerminalCapabilities } from "@opentui/core/testing";
import { make5000LineNote, make5000LineTs } from "../fixtures/generate";
import { mountShell } from "../support/ui";

const { values } = parseArgs({
  options: { file: { type: "string" }, zoom: { type: "string" } },
});
if (values.file !== "note" && values.file !== "ts")
  throw new Error("usage: scroll.bench.ts --file note|ts [--zoom Z]");
const note = values.file === "note";
const zoom = values.zoom;

let text: string;
if (note) {
  const dir = await mkdtemp(join(tmpdir(), "so-bench-"));
  text = await readFile(await make5000LineNote(dir), "utf8");
  await rm(dir, { recursive: true });
} else text = make5000LineTs();

const m = await mountShell({
  cols: 120,
  rows: 40,
  ...(zoom === undefined
    ? {}
    : {
        config: `[preview]\nmode = "reading"\nzoom = ${zoom}\n`,
        capabilities: {
          caps: createTerminalCapabilities({ scaled_text: true }),
          hasResolution: false,
        },
      }),
});
m.keys("<leader>e");
m.open(note ? "long.md" : "src/big.ts", text);
await m.frame();
const view = m.store.get().buffers[1]?.view;
if (view !== (zoom !== undefined ? "reading" : note ? "live" : "source"))
  throw new Error(`the file opened in ${view} view`);

const keys = [
  ...Array.from({ length: 60 }, () => "j"),
  ...Array.from({ length: 40 }, () => "<C-d>"),
  ...Array.from({ length: 40 }, () => "<C-u>"),
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
const metric =
  zoom !== undefined
    ? "zoomScrollFrameP95"
    : note
      ? "liveScrollFrameP95"
      : "sourceScrollFrameP95";
console.log(JSON.stringify({ metric, ms: p95, frames: times.length }));
