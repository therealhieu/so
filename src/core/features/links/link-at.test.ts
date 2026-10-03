import { expect, test } from "bun:test";
import { createTextBuffer } from "../../kernel/text/text-buffer";
import { parseDoc } from "../../lang/markdown/doc";
import { linkAt } from "./link-at";

const scanOf = (text: string) => parseDoc(createTextBuffer(text)).scan;

test("the link under the cursor, end exclusive, never inside code", () => {
  const scan = scanOf("See [[plan#Goals]] and [[b]].\n\n```\n[[code]]\n```\n");
  expect(linkAt(scan, { line: 0, col: 4 })?.target).toBe("plan");
  expect(linkAt(scan, { line: 0, col: 17 })?.subpath).toBe("#Goals");
  expect(linkAt(scan, { line: 0, col: 18 })).toBeUndefined();
  expect(linkAt(scan, { line: 0, col: 24 })?.target).toBe("b");
  expect(linkAt(scan, { line: 3, col: 2 })).toBeUndefined();
});
