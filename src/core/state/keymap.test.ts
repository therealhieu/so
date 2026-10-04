import { expect, test } from "bun:test";
import { testRegistries } from "../../../test/support/state";
import { type AppConfig, defaults } from "../config/schema";
import { effectiveBindings, keymapFor } from "./keymap";

const normal = { mode: "normal" } as const;
const withConfig = (patch: Partial<AppConfig>): AppConfig => ({
  ...defaults,
  ...patch,
});

test("leader comma maps <leader> sequences", () => {
  const km = keymapFor(testRegistries(), withConfig({ leader: "," }));
  expect(km.lookup(normal, [",", "e"])).toEqual({
    kind: "command",
    id: "explorer.toggle",
  });
  expect(km.lookup(normal, [" ", "e"])).toEqual({ kind: "none" });
});

test("the keymap is memoized per config object", () => {
  const reg = testRegistries();
  const config = withConfig({});
  const km = keymapFor(reg, config);
  expect(keymapFor(reg, config)).toBe(km);
  expect(keymapFor(reg, withConfig({}))).not.toBe(km);
  expect(keymapFor(testRegistries(), config)).not.toBe(km);
});

test("config overrides replace defaults per scope and are marked", () => {
  const reg = testRegistries();
  const config = withConfig({
    keys: {
      normal: { "<leader>e": "window.split", "<leader>w": "buffer.next" },
    },
    filetypes: {
      markdown: { keys: { normal: { "<leader>w": "buffer.prev" } } },
    },
  });
  const bindings = effectiveBindings(reg, config);
  expect(bindings.filter((b) => b.seq === "<leader>e")).toEqual([
    { scope: normal, seq: "<leader>e", id: "window.split", overridden: true },
    { scope: { mode: "explorer" }, seq: "<leader>e", id: "explorer.toggle" },
  ]);
  expect(bindings.filter((b) => b.seq === "<leader>w")).toEqual([
    { scope: normal, seq: "<leader>w", id: "buffer.next", overridden: true },
    {
      scope: { mode: "normal", filetype: "markdown" },
      seq: "<leader>w",
      id: "buffer.prev",
      overridden: true,
    },
  ]);
  const km = keymapFor(reg, config);
  expect(km.lookup(normal, [" ", "w"])).toEqual({
    kind: "command",
    id: "buffer.next",
  });
  expect(
    km.lookup({ mode: "normal", filetype: "markdown" }, [" ", "w"]),
  ).toEqual({ kind: "command", id: "buffer.prev" });
  expect(
    km.lookup({ mode: "normal", filetype: "typescript" }, [" ", "w"]),
  ).toEqual({ kind: "command", id: "buffer.next" });
});

test("an override written with a named key replaces the same sequence", () => {
  const config = withConfig({ keys: { normal: { " e": "window.split" } } });
  const bindings = effectiveBindings(testRegistries(), config).filter(
    (b) => b.scope.mode === "normal" && b.id === "explorer.toggle",
  );
  expect(bindings).toEqual([]);
});
