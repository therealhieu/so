import { afterAll, beforeAll, expect, test } from "bun:test";
import { type Mounted, mountShell } from "../support/ui";

let m: Mounted;

beforeAll(async () => {
  m = await mountShell({ cols: 80, rows: 24, kittyKeyboard: false });
  m.keys("<leader>e");
  m.open("notes/ideas.md", "one\ntwo\nthree\n");
});
afterAll(() => m.destroy());

/** Milliseconds from now until `pred` holds, polling every millisecond. */
async function elapsedUntil(pred: () => boolean): Promise<number> {
  const start = performance.now();
  while (!pred()) {
    if (performance.now() - start > 1000) throw new Error("timed out");
    await Bun.sleep(1);
  }
  return performance.now() - start;
}

const median = (xs: number[]) =>
  [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? NaN;

test("a legacy Esc byte leaves Insert after the 50 ms timeout", async () => {
  const times: number[] = [];
  for (let i = 0; i < 5; i++) {
    m.keys("i");
    expect(m.store.get().vim.mode).toBe("insert");
    m.t.mockInput.pressEscape();
    times.push(await elapsedUntil(() => m.store.get().vim.mode === "normal"));
  }
  for (const t of times) expect(t).toBeGreaterThanOrEqual(40);
  expect(median(times)).toBeLessThanOrEqual(60);
});

test("an arrow key's escape sequence reaches the store at once", async () => {
  let dispatched = 0;
  const stop = m.store.subscribe(() => dispatched++);
  const times: number[] = [];
  for (let i = 0; i < 5; i++) {
    const before = dispatched;
    m.t.mockInput.pressKey("ARROW_UP");
    times.push(await elapsedUntil(() => dispatched > before));
  }
  stop();
  for (const t of times) expect(t).toBeLessThan(10);
});
