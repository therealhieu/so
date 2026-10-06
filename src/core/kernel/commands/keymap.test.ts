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
  const root = km.lookup(normal, [" "]);
  expect(root.kind).toBe("prefix");
  expect(root.kind === "prefix" ? root.next : []).toContainEqual({
    key: "e",
    id: "explorer.toggle",
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

test("leaderFrom resolves leader sequences in that mode after the scope's own", () => {
  const km = new Keymap();
  km.bind(normal, "<leader>ff", "find.files");
  km.bind(normal, "<leader>e", "explorer.toggle");
  km.bind(normal, "gd", "lsp.definition");
  km.bind({ mode: "normal", filetype: "markdown" }, "<leader>m", "view.cycle");
  const explorer = { mode: "explorer", leaderFrom: "normal" } as const;
  km.bind({ mode: "explorer" }, "<leader>e", "explorer.close");
  expect(km.lookup(explorer, [" ", "f", "f"])).toEqual({
    kind: "command",
    id: "find.files",
  });
  // The explorer's own binding wins; file-type and non-leader keys stay out.
  expect(km.lookup(explorer, [" ", "e"])).toEqual({
    kind: "command",
    id: "explorer.close",
  });
  expect(km.lookup(explorer, ["g", "d"])).toEqual({ kind: "none" });
  expect(km.lookup(explorer, [" "])).toEqual({
    kind: "prefix",
    next: [{ key: "e", id: "explorer.close" }, { key: "f" }],
  });
});
