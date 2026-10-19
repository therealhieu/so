import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { imageInfo } from "@opentui/core";
import { pictureSize } from "./picture-size";

const fixtures = join(import.meta.dir, "../../test/fixtures/images");
const files = [
  ...readdirSync(join(fixtures, "sizes")).map((f) =>
    join(fixtures, "sizes", f),
  ),
  join(fixtures, "diagram.png"),
  join(fixtures, "wide.png"),
];

test.each(files)("%s: the header gives the decoder's size", (file) => {
  const bytes = new Uint8Array(readFileSync(file));
  const info = imageInfo(bytes);
  expect(pictureSize(bytes)).toEqual({
    width: info.width,
    height: info.height,
  });
});

test("a JPEG turned by its EXIF orientation reports the turned size", () => {
  const bytes = new Uint8Array(
    readFileSync(join(fixtures, "sizes/turned.jpg")),
  );
  expect(pictureSize(bytes)).toEqual({ width: 30, height: 48 });
});

test("bytes that are no known picture, or cut short, give no size", () => {
  const jpeg = new Uint8Array(readFileSync(join(fixtures, "sizes/plain.jpg")));
  expect(pictureSize(new Uint8Array([1, 2, 3]))).toBeUndefined();
  expect(pictureSize(jpeg.subarray(0, 40))).toBeUndefined();
  expect(pictureSize(new Uint8Array(0))).toBeUndefined();
});
