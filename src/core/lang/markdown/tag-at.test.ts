import { expect, test } from "bun:test";
import { createTextBuffer } from "../../kernel/text/text-buffer";
import { parseDoc } from "./doc";
import { tagAt } from "./tag-at";

function at(text: string, line: number, col: number) {
  const buf = createTextBuffer(text);
  return tagAt(parseDoc(buf), buf, { line, col });
}

test("an inline tag is found anywhere on it, including its #", () => {
  const text = "see [[tour]] #so/ui and more\n";
  expect(at(text, 0, 13)).toBe("so/ui");
  expect(at(text, 0, 18)).toBe("so/ui");
  expect(at(text, 0, 19)).toBeUndefined();
  expect(at(text, 0, 5)).toBeUndefined();
});

test("a flow list in frontmatter gives the item under the column", () => {
  const text = "---\ntitle: x\ntags: [so, 'planning', #a]\n---\nbody\n";
  expect(at(text, 2, 7)).toBe("so");
  expect(at(text, 2, 9)).toBe("so");
  expect(at(text, 2, 12)).toBe("planning");
  expect(at(text, 2, 24)).toBe("a");
  expect(at(text, 2, 2)).toBeUndefined();
  expect(at(text, 1, 8)).toBeUndefined();
});

test("a scalar or a block list under tags gives its item", () => {
  expect(at("---\ntags: solo\n---\n", 1, 7)).toBe("solo");
  const block = '---\ntags:\n  - daily\n  - "so"\naliases:\n  - x\n---\n';
  expect(at(block, 2, 5)).toBe("daily");
  expect(at(block, 3, 4)).toBe("so");
  expect(at(block, 2, 0)).toBeUndefined();
  expect(at(block, 5, 4)).toBeUndefined();
});

test("frontmatter fences and body lines have no frontmatter tag", () => {
  const text = "---\ntags: [so]\n---\ntags: [so]\n";
  expect(at(text, 0, 1)).toBeUndefined();
  expect(at(text, 2, 1)).toBeUndefined();
  expect(at(text, 3, 7)).toBeUndefined();
});
