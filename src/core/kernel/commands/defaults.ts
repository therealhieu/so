import type { KeyScope } from "./keymap";

/** A key binding; `overridden` marks one that comes from the user's config. */
export type Binding = {
  scope: KeyScope;
  seq: string;
  id: string;
  overridden?: true;
};

/**
 * Built-in bindings. Keymap bindings run before the vim engine, so these
 * sequences never reach it in their mode.
 */
export const defaultBindings: readonly Binding[] = [
  { scope: { mode: "normal" }, seq: "<leader>e", id: "explorer.toggle" },
  { scope: { mode: "normal" }, seq: "<C-w>h", id: "window.focush" },
  { scope: { mode: "normal" }, seq: "<C-w>j", id: "window.focusj" },
  { scope: { mode: "normal" }, seq: "<C-w>k", id: "window.focusk" },
  { scope: { mode: "normal" }, seq: "<C-w>l", id: "window.focusl" },
  { scope: { mode: "normal" }, seq: "<C-w>s", id: "window.split" },
  { scope: { mode: "normal" }, seq: "<C-w>v", id: "window.vsplit" },
  { scope: { mode: "normal" }, seq: "<C-o>", id: "jump.back" },
  { scope: { mode: "normal" }, seq: "<C-i>", id: "jump.forward" },
  { scope: { mode: "normal" }, seq: "<Tab>", id: "jump.forward" },
  { scope: { mode: "explorer" }, seq: "j", id: "explorer.down" },
  { scope: { mode: "explorer" }, seq: "k", id: "explorer.up" },
  { scope: { mode: "explorer" }, seq: "<CR>", id: "explorer.open" },
  { scope: { mode: "explorer" }, seq: "l", id: "explorer.expand" },
  { scope: { mode: "explorer" }, seq: "h", id: "explorer.collapse" },
  { scope: { mode: "explorer" }, seq: "a", id: "explorer.create" },
  { scope: { mode: "explorer" }, seq: "r", id: "explorer.rename" },
  { scope: { mode: "explorer" }, seq: "m", id: "explorer.move" },
  { scope: { mode: "explorer" }, seq: "d", id: "explorer.delete" },
  { scope: { mode: "explorer" }, seq: "<leader>e", id: "explorer.toggle" },
];

/** Which-key group labels by prefix sequence. */
export const defaultGroups: Readonly<Record<string, string>> = {
  "<leader>f": "find",
  "<leader>s": "search",
  "<leader>b": "buffer",
  "<leader>w": "window",
  "<leader>u": "ui",
};
