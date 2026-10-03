// Start the real app in a pseudo-terminal on 10,000 generated notes and
// time, from the spawn, either the first painted statusline
// (`--metric firstFrame`) or `◆ index ready` in it (`--metric indexReady`).
// Prints {"metric":<metric>,"ms":<ms>}.
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { ready, runInPty, statusRow } from "../e2e/pty";
import { makeNoteWorkspace } from "../fixtures/generate";

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: { metric: { type: "string" } },
});
const metric = values.metric;
if (metric !== "firstFrame" && metric !== "indexReady")
  throw new Error("usage: startup.bench.ts --metric firstFrame|indexReady");

const ROWS = 30;
const MODES = /\b(NORMAL|EXPLORER)\b/;

const tmp = await mkdtemp(join(tmpdir(), "so-bench-startup-"));
const ws = join(tmp, "notes");
await mkdir(ws);
await makeNoteWorkspace(ws);

/** Resolve once `pred` holds, polling every millisecond. */
async function until(pred: () => boolean, ms: number): Promise<void> {
  const end = performance.now() + ms;
  while (!pred()) {
    if (performance.now() > end) throw new Error(`${metric} timed out`);
    await Bun.sleep(1);
  }
}

let elapsed = Number.NaN;
try {
  const r = await runInPty([process.execPath, "src/app/main.ts", ws], {
    rows: ROWS,
    cols: 100,
    // No user config: an empty config home.
    env: { XDG_CONFIG_HOME: tmp },
    async script(p) {
      const start = performance.now();
      if (metric === "firstFrame")
        await until(() => MODES.test(statusRow(p)), 10_000);
      else await until(() => statusRow(p).includes("◆ index ready"), 30_000);
      elapsed = performance.now() - start;
      await ready(p);
      p.type(":q\r");
    },
  });
  if (r.exitCode !== 0) throw new Error(`so exited ${r.exitCode}`);
} finally {
  await rm(tmp, { recursive: true, force: true });
}
console.log(JSON.stringify({ metric, ms: elapsed }));
