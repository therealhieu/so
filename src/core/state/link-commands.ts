import { linkAt } from "../features/links/link-at";
import type { LinkTarget } from "../features/links/resolve";
import { resolveLink } from "../features/links/resolve";
import type { Binding } from "../kernel/commands/defaults";
import type { Mode } from "../kernel/commands/keymap";
import type { Command } from "../kernel/commands/registry";
import type { Doc } from "../lang/markdown/doc";
import { activeBuffer, activeWindow } from "./buffers";
import type { CommandContext, CommandResult } from "./commands";
import { createTarget } from "./explorer";
import { goTo, recordJump } from "./jumps";
import { startRename } from "./link-edits";
import { openPicker } from "./picker";
import { none } from "./result";
import { linkMentionAtPanel, toggleSidePanel } from "./side-panel";
import type { AppState, Result } from "./types";

type AppCommand = Command<CommandContext, CommandResult>;

const dirname = (path: string) => path.slice(0, path.lastIndexOf("/") + 1);
const lower = (text: string) => text.toLowerCase();

type Anchors = {
  headings: readonly { text: string; level: number; line: number }[];
  blocks: readonly { id: string; line: number }[];
};

/** Headings and blocks of `path`: the live scan when it is open, else its summary. */
export function anchorsOf(s: AppState, path: string): Anchors | undefined {
  const open = Object.values(s.buffers).find((b) => b.path === path);
  const scan = (open?.analysis as Doc | undefined)?.scan;
  if (scan !== undefined)
    return { headings: scan.headings, blocks: scan.blockIds };
  return s.index.ix.summaries.get(path);
}

/**
 * The line a heading path ("A#B": B under A, in order) or a block id points
 * to in `path`; 0 when it names nothing there.
 */
function targetLine(s: AppState, t: LinkTarget): number {
  const anchors = anchorsOf(s, t.path);
  if (anchors === undefined) return 0;
  if (t.block !== undefined)
    return (
      anchors.blocks.find((b) => lower(b.id) === lower(t.block ?? ""))?.line ??
      0
    );
  let line = 0;
  let from = 0;
  for (const part of t.heading ?? []) {
    const at = anchors.headings.findIndex(
      (h, i) => i >= from && lower(h.text) === lower(part),
    );
    if (at < 0) return line;
    line = anchors.headings[at]?.line ?? line;
    from = at + 1;
  }
  return line;
}

/** Where a missing link target is created: beside the note, or from the root when it names folders. */
function newNotePath(from: string, target: string): string {
  const name = createTarget(target.replace(/^\//, "")).path;
  return target.includes("/") ? name : dirname(from) + name;
}

/**
 * `gd` / Enter on a link: open its target at the heading or block with the
 * source recorded as a jump (as Vim does, so the statusline reads "jump 2/2"
 * after one follow), offer to create a missing note, and do nothing off a link.
 */
function followLink(c: CommandContext): Result {
  const s = c.state;
  const b = activeBuffer(s);
  const w = activeWindow(s);
  const doc = b?.analysis as Doc | undefined;
  if (b === undefined || w === undefined || doc === undefined) return none(s);
  const link = linkAt(doc.scan, w.content.cursor);
  if (link === undefined) return none(s);
  const target = resolveLink(s.index.ix, b.path, link);
  if ("unresolved" in target) {
    const path = newNotePath(b.path, target.unresolved);
    return none({
      ...s,
      overlay: {
        kind: "prompt",
        prompt: {
          kind: "confirm",
          title: `Create ${path}? [y/N]`,
          value: "",
          op: { kind: "create", from: path, dir: false },
        },
      },
    });
  }
  const pos = { line: targetLine(s, target), col: 0 };
  return goTo(recordJump(s), target.path, pos, c.now);
}

/** The file a rename or move is about: the explorer selection while it has focus, else the open file. */
const focusedPath = (s: AppState): string =>
  s.panels.explorer.focused
    ? s.panels.explorer.cursor
    : (activeBuffer(s)?.path ?? "");

export const linkCommands: readonly AppCommand[] = [
  {
    id: "link.follow",
    title: "Follow link",
    filetypes: ["markdown"],
    run: followLink,
  },
  {
    id: "link.backlinks",
    title: "Toggle backlinks panel",
    filetypes: ["markdown"],
    run: (c) => toggleSidePanel(c, "backlinks"),
  },
  {
    id: "link.linkMention",
    title: "Link this mention",
    filetypes: ["markdown"],
    run: linkMentionAtPanel,
  },
  {
    id: "view.outline",
    title: "Toggle outline",
    filetypes: ["markdown"],
    run: (c) => toggleSidePanel(c, "outline"),
  },
  {
    id: "search.headings",
    title: "Headings in note",
    filetypes: ["markdown"],
    run: (c) => openPicker(c, "headings"),
  },
  {
    id: "search.backlinks",
    title: "Search backlinks of this note",
    filetypes: ["markdown"],
    run: (c) => openPicker(c, "backlinks", activeBuffer(c.state)?.path),
  },
  { id: "search.tags", title: "Tags", run: (c) => openPicker(c, "tags") },
  {
    id: "file.rename",
    title: "Rename (update links)",
    run: (c) => startRename(c, "rename", focusedPath(c.state)),
  },
  {
    id: "file.move",
    title: "Move (update links)",
    run: (c) => startRename(c, "move", focusedPath(c.state)),
  },
];

const md = (mode: Mode) => ({ mode, filetype: "markdown" }) as const;

export const linkBindings: readonly Binding[] = [
  { scope: md("normal"), seq: "gd", id: "link.follow" },
  { scope: md("normal"), seq: "<CR>", id: "link.follow" },
  { scope: md("normal"), seq: "<leader>lb", id: "link.backlinks" },
  { scope: md("normal"), seq: "<leader>lr", id: "file.rename" },
  { scope: md("normal"), seq: "<leader>o", id: "view.outline" },
  { scope: md("normal"), seq: "<leader>sh", id: "search.headings" },
  { scope: md("normal"), seq: "<leader>sb", id: "search.backlinks" },
];

export const linkGroups = { "<leader>l": "links" } as const;
