// Open the 5,000-line note: from the file's contents arriving to the first
// rendered frame. Prints {"metric":"openFile","ms":<ms>}.
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { make5000LineNote } from "../fixtures/generate";
import { mountShell } from "../support/ui";

const path = await make5000LineNote(await mkdtemp(join(tmpdir(), "so-bench-")));
const text = await readFile(path, "utf8");
const m = await mountShell({ cols: 120, rows: 36 });
m.keys("<leader>e");
await m.frame();
const start = performance.now();
m.open("long.md", text);
await m.t.renderOnce();
const ms = performance.now() - start;
m.destroy();
console.log(JSON.stringify({ metric: "openFile", ms }));
