// Open the 5,000-line TypeScript file: from the file's contents arriving to
// the first rendered frame. Prints {"metric":"sourceOpenFile","ms":<ms>}.
import { make5000LineTs } from "../fixtures/generate";
import { mountShell } from "../support/ui";

const text = make5000LineTs();
const m = await mountShell({ cols: 120, rows: 36 });
m.keys("<leader>e");
await m.frame();
const start = performance.now();
m.open("src/big.ts", text);
await m.t.renderOnce();
const ms = performance.now() - start;
m.destroy();
console.log(JSON.stringify({ metric: "sourceOpenFile", ms }));
