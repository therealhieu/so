import { expect, test } from "bun:test";
import { bunRun, ppmToRgba } from "./tool-run";

test("a PPM becomes opaque RGBA; anything else is refused", () => {
  const ppm = new Uint8Array([
    ...new TextEncoder().encode("P6\n# made by hand\n2 1\n255\n"),
    10,
    20,
    30,
    40,
    50,
    60,
  ]);
  expect(ppmToRgba(ppm)).toEqual({
    rgba: new Uint8Array([10, 20, 30, 255, 40, 50, 60, 255]),
    width: 2,
    height: 1,
  });
  expect(() => ppmToRgba(new Uint8Array([0x89, 0x50]))).toThrow("not a PPM");
  expect(() => ppmToRgba(ppm.subarray(0, ppm.length - 1))).toThrow("truncated");
});

test("a run past its timeout or output cap is killed and fails", async () => {
  await expect(
    bunRun(["sleep", "5"], { timeoutMs: 50, maxBytes: 1024 }),
  ).rejects.toThrow("timed out");
  await expect(
    bunRun(["yes"], { timeoutMs: 5_000, maxBytes: 1024 }),
  ).rejects.toThrow("output too large");
});
