import { afterAll, beforeAll, expect, test } from "bun:test";
import { type Mounted, mountShell } from "../support/ui";

let m: Mounted;

beforeAll(async () => {
  m = await mountShell({ cols: 80, rows: 24, kittyKeyboard: false });
  m.keys("<leader>e");
  m.open("notes/ideas.md", "one\ntwo\nthree\n");
});
afterAll(() => m.destroy());

/**
 * Milliseconds from now until a store update satisfies `pred`, timed at the
 * update itself so polling delay does not count.
 */
function dispatchedWithin(pred: () => boolean): Promise<number> {
  const start = performance.now();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      stop();
      reject(new Error("timed out"));
    }, 1000);
    const stop = m.store.subscribe(() => {
      if (!pred()) return;
      clearTimeout(timeout);
      stop();
      resolve(performance.now() - start);
    });
  });
}

const median = (xs: number[]) =>
  [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? Number.NaN;

test("a legacy Esc byte leaves Insert after the 50 ms timeout", async () => {
  const times: number[] = [];
  for (let i = 0; i < 5; i++) {
    m.keys("i");
    expect(m.store.get().vim.mode).toBe("insert");
    const done = dispatchedWithin(() => m.store.get().vim.mode === "normal");
    m.t.mockInput.pressEscape();
    times.push(await done);
  }
  for (const t of times) expect(t).toBeGreaterThanOrEqual(40);
  // Headroom for timer lag while other suites run in parallel.
  expect(median(times)).toBeLessThanOrEqual(100);
});

test("an arrow key's escape sequence reaches the store at once", async () => {
  const times: number[] = [];
  for (let i = 0; i < 5; i++) {
    const done = dispatchedWithin(() => true);
    m.t.mockInput.pressKey("ARROW_UP");
    times.push(await done);
  }
  // Never held for the 50 ms escape timeout; headroom for a slow runner.
  for (const t of times) expect(t).toBeLessThan(40);
  expect(median(times)).toBeLessThan(10);
});
