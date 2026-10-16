import { expect, test } from "bun:test";
import { createSvgRasterizer } from "./svg";

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100">' +
  '<rect x="100" y="0" width="100" height="100" fill="#ff0000"/>' +
  '<text x="10" y="50" font-family="sans-serif" font-size="20" fill="#ffffff">Hi</text></svg>';

test("a crop of an SVG is drawn at the asked pixel size over its background", async () => {
  const rasterize = createSvgRasterizer();
  const draw = (x: number) =>
    rasterize({
      svg: SVG,
      background: "#000000",
      crop: { x, y: 0, w: 100, h: 100 },
      width: 40,
      height: 30,
    });
  const right = await draw(100);
  expect([right.width, right.height, right.rgba.length]).toEqual([
    40,
    30,
    40 * 30 * 4,
  ]);
  // The right half of the SVG is the red square, edge to edge.
  expect([...right.rgba.subarray(0, 4)]).toEqual([255, 0, 0, 255]);
  const left = await draw(0);
  expect([...left.rgba.subarray(0, 4)]).toEqual([0, 0, 0, 255]);
});

test("without a sans-serif font every call fails", async () => {
  const rasterize = createSvgRasterizer({
    sans: ["/nonexistent.ttf"],
    mono: [],
  });
  const r = {
    svg: SVG,
    background: "#000",
    crop: { x: 0, y: 0, w: 1, h: 1 },
    width: 1,
    height: 1,
  };
  await expect(rasterize(r)).rejects.toThrow("no system font");
  await expect(rasterize(r)).rejects.toThrow("no system font");
});

test("a file's own size attributes give way to the crop, in either quotes", async () => {
  const rasterize = createSvgRasterizer();
  const out = await rasterize({
    svg:
      "<svg xmlns='http://www.w3.org/2000/svg' width='9' height = \"9\" viewBox='10 0 10 10'>" +
      "<rect x='10' y='0' width='5' height='10' fill='#00ff00'/></svg>",
    background: "transparent",
    crop: { x: 10, y: 0, w: 10, h: 10 },
    width: 20,
    height: 20,
  });
  expect([out.width, out.height]).toEqual([20, 20]);
  // The left half is the green rect; the right half stays transparent.
  expect([...out.rgba.subarray(0, 4)]).toEqual([0, 255, 0, 255]);
  expect(out.rgba[(20 - 1) * 4 + 3]).toBe(0);
});
