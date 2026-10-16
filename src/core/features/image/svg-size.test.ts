import { expect, test } from "bun:test";
import { svgRasterSize, svgSize } from "./svg-size";

test("an SVG's size comes from its width and height, else its viewBox, else 300×150", () => {
  expect(
    svgSize('<?xml version="1.0"?><svg width="40" height="20px"></svg>'),
  ).toEqual({ box: { x: 0, y: 0, w: 40, h: 20 }, width: 40, height: 20 });
  expect(svgSize("<svg viewBox='-5 10 100 50'/>")).toEqual({
    box: { x: -5, y: 10, w: 100, h: 50 },
    width: 100,
    height: 50,
  });
  expect(svgSize("<svg><rect/></svg>")).toEqual({
    box: { x: 0, y: 0, w: 300, h: 150 },
    width: 300,
    height: 150,
  });
  expect(svgSize("<html></html>")).toBeUndefined();
});

test("a missing side follows the viewBox's aspect; other units fall back to it", () => {
  expect(svgSize('<svg viewBox="0 0 200 100" width="50">')).toMatchObject({
    width: 50,
    height: 25,
  });
  expect(
    svgSize('<svg viewBox="0 0 200 100" width="100%" height="10cm">'),
  ).toMatchObject({ width: 200, height: 100 });
});

test("an SVG draws with its longest side at 2048 pixels, within 8 megapixels", () => {
  const size = (width: number, height: number) => ({
    box: { x: 0, y: 0, w: width, h: height },
    width,
    height,
  });
  expect(svgRasterSize(size(16, 8))).toEqual({ width: 2048, height: 1024 });
  const square = svgRasterSize(size(5000, 5000));
  expect(square.width * square.height).toBeLessThanOrEqual(8_000_000);
  expect(square.width).toBe(square.height);
});
