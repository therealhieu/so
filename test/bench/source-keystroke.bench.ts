// 200 keystrokes in a 5,000-line TypeScript file in source view, each
// through the store, the reducer, layout, and a rendered frame. Prints
// {"metric":"sourceKeystrokeP95","ms":<p95>}.
import { make5000LineTs } from "../fixtures/generate";
import { mountShell } from "../support/ui";

const m = await mountShell({ cols: 120, rows: 36 });
m.keys("<leader>e");
m.open("src/big.ts", make5000LineTs());
await m.frame();
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
  JSON.stringify({ metric: "sourceKeystrokeP95", ms: p95, keys: times.length }),
);
