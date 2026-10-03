import { expect, test } from "bun:test";
import {
  closeWindow,
  focusDirection,
  splitWindow,
  type WindowTree,
} from "./windows";

test("split, focus by direction, and close", () => {
  // :vs on 1 → [2 | 1]; :sp on 1 → [2 | [3 / 1]]
  let tree: WindowTree = { kind: "leaf", id: 1 };
  tree = splitWindow(tree, 1, "row", 2);
  tree = splitWindow(tree, 1, "column", 3);
  expect(focusDirection(tree, 1, "h")).toBe(2);
  expect(focusDirection(tree, 1, "k")).toBe(3);
  expect(focusDirection(tree, 3, "j")).toBe(1);
  expect(focusDirection(tree, 2, "l")).toBe(1); // middle of 2 is the 3/1 border
  expect(focusDirection(tree, 3, "h")).toBe(2);
  expect(focusDirection(tree, 2, "h")).toBeUndefined();

  tree = closeWindow(tree, 3) as WindowTree;
  expect(tree).toEqual({
    kind: "row",
    children: [
      { kind: "leaf", id: 2 },
      { kind: "leaf", id: 1 },
    ],
  });
  expect(closeWindow({ kind: "leaf", id: 1 }, 1)).toBeUndefined();
});

test("splitting in the same direction adds a sibling", () => {
  let tree: WindowTree = { kind: "leaf", id: 1 };
  tree = splitWindow(tree, 1, "row", 2);
  tree = splitWindow(tree, 1, "row", 3);
  expect(tree).toEqual({
    kind: "row",
    children: [
      { kind: "leaf", id: 2 },
      { kind: "leaf", id: 3 },
      { kind: "leaf", id: 1 },
    ],
  });
});
