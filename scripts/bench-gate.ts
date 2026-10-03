// Runs each benchmark 5 times in a fresh process, prints the medians, saves
// the raw results under .so-bench/, and exits 1 when a median exceeds twice
// its target.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** Targets in milliseconds; the gate fails above twice these. */
export const TARGETS = { sourceKeystrokeP95: 16, openFile: 50 } as const;

const BENCHES: Record<keyof typeof TARGETS, string> = {
  sourceKeystrokeP95: "test/bench/source-keystroke.bench.ts",
  openFile: "test/bench/open-file.bench.ts",
};
const RUNS = 5;
const root = join(import.meta.dir, "..");

async function runOnce(file: string): Promise<number> {
  const p = Bun.spawn([process.execPath, file], {
    cwd: root,
    stdout: "pipe",
    stderr: "inherit",
  });
  const out = await new Response(p.stdout).text();
  if ((await p.exited) !== 0) throw new Error(`${file} failed`);
  const last = out.trim().split("\n").at(-1) ?? "";
  const { ms } = JSON.parse(last) as { ms: number };
  return ms;
}

const median = (xs: number[]) =>
  [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? Number.NaN;

export async function main(): Promise<number> {
  const results: Record<string, number[]> = {};
  let failed = false;
  for (const [name, file] of Object.entries(BENCHES) as [
    keyof typeof TARGETS,
    string,
  ][]) {
    const runs: number[] = [];
    for (let i = 0; i < RUNS; i++) runs.push(await runOnce(file));
    results[name] = runs;
    const med = median(runs);
    const limit = 2 * TARGETS[name];
    const ok = med <= limit;
    failed ||= !ok;
    console.log(
      `${name} median=${med.toFixed(2)}ms limit=${limit}ms ${ok ? "ok" : "FAIL"}`,
    );
  }
  await mkdir(join(root, ".so-bench"), { recursive: true });
  await writeFile(
    join(root, ".so-bench", "results.json"),
    `${JSON.stringify({ at: new Date().toISOString(), platform: process.platform, results }, null, 2)}\n`,
  );
  return failed ? 1 : 0;
}

if (import.meta.main) process.exit(await main());
