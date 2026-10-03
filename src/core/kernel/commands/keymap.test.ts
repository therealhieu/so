import { expect, test } from "bun:test";
import { splitKeys } from "../vim/keys";
import { defaultBindings } from "./defaults";
import { Keymap } from "./keymap";

const normal = { mode: "normal" } as const;

test("the leader defaults to space", () => {
  expect(splitKeys("<leader>e")).toEqual([" ", "e"]);
  expect(splitKeys("<Leader>e")).toEqual([" ", "e"]);
  expect(splitKeys("<space>")).toEqual([" "]);
});

test("a configured leader replaces <leader>", () => {
  expect(splitKeys("<leader>ff", ",")).toEqual([",", "f", "f"]);
  expect(splitKeys("<leader>w", "<C-a>")).toEqual(["<C-a>", "w"]);
  const km = new Keymap({ leader: "," });
  km.bind(normal, "<leader>e", "explorer.toggle");
  expect(km.lookup(normal, [",", "e"])).toEqual({
    kind: "command",
    id: "explorer.toggle",
  });
  expect(km.lookup(normal, [" ", "e"])).toEqual({ kind: "none" });
});

test("no leader option keeps space as the leader for the default bindings", () => {
  const km = new Keymap();
  for (const b of defaultBindings) km.bind(b.scope, b.seq, b.id);
  expect(km.lookup(normal, [" "])).toEqual({
    kind: "prefix",
    next: [{ key: "e", id: "explorer.toggle" }],
  });
  expect(km.lookup(normal, [" ", "e"])).toEqual({
    kind: "command",
    id: "explorer.toggle",
  });
  expect(km.lookup(normal, ["<C-w>", "v"])).toEqual({
    kind: "command",
    id: "window.vsplit",
  });
});
