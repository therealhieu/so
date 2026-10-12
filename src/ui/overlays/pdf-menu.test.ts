import { expect, test } from "bun:test";
import { pdfMenuBox } from "./pdf-menu";

const area = { x: 10, y: 1, w: 60, h: 20 };
const size = { w: 30, h: 3 };

test("the float goes below its text, starting under it", () => {
  expect(pdfMenuBox({ x: 20, top: 4, bottom: 5 }, size, area)).toEqual({
    x: 20,
    y: 6,
    w: 30,
    h: 3,
  });
});

test("without room below it goes above, else along the bottom", () => {
  expect(pdfMenuBox({ x: 20, top: 18, bottom: 19 }, size, area).y).toBe(15);
  const tall = { w: 30, h: 19 };
  expect(pdfMenuBox({ x: 20, top: 5, bottom: 6 }, tall, area).y).toBe(2);
});

test("it stays inside the window across and is cut to its size", () => {
  expect(pdfMenuBox({ x: 65, top: 4, bottom: 4 }, size, area).x).toBe(40);
  expect(pdfMenuBox({ x: 0, top: 4, bottom: 4 }, size, area).x).toBe(10);
  expect(
    pdfMenuBox({ x: 0, top: 4, bottom: 4 }, { w: 90, h: 40 }, area),
  ).toEqual(area);
});
