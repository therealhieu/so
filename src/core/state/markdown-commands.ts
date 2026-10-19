import type { Binding } from "../kernel/commands/defaults";
import type { Mode } from "../kernel/commands/keymap";
import type { Command } from "../kernel/commands/registry";
import type { Doc } from "../lang/markdown/doc";
import { blocksIn } from "../lang/markdown/live-preview";
import { renderKey } from "../lang/markdown/render-key";
import {
  activeBuffer,
  activeWindow,
  applyBufferEdits,
  flipFold,
  readOnlyHint,
  readOnlyView,
  setBuffer,
  setWindow,
} from "./buffers";
import type { CommandContext, CommandResult } from "./commands";
import { typeKeys } from "./keys";
import { followLink } from "./link-commands";
import { startPreview, stopPreview } from "./preview";
import { message, none } from "./result";
import { toggleJustify, toggleReadable, zoomText } from "./settings";
import type { Result } from "./types";
import { openZoom } from "./zoom";

type AppCommand = Command<CommandContext, CommandResult>;

/**
 * `key` in a note's reading view: a text zoom step. In the other views the
 * key goes to the vim engine as typed.
 */
const zoomKey = (
  id: string,
  key: "+" | "=" | "-",
  step: 1 | -1,
): AppCommand => ({
  id,
  title:
    step === 1 ? `Zoom note text in (${key})` : `Zoom note text out (${key})`,
  filetypes: ["markdown"],
  run: (c) =>
    activeBuffer(c.state)?.view === "reading"
      ? zoomText(c.state, step)
      : typeKeys(c.state, [key], c.now, c.reg),
});

/** A task item's checkbox: the `[`, its mark, and the `]`. */
const TASK = /^([ \t]*(?:[-+*]|\d{1,9}[.)])[ \t]+\[)([ xX])\]/;

/** `<leader>m`: the next of the file type's views, with its name in the message line. */
function cycleView(c: CommandContext): Result {
  const s = c.state;
  const b = activeBuffer(s);
  const views = (b && c.reg.fileTypes.get(b.fileType)?.views) ?? [];
  if (b === undefined || views.length < 2) return none(s);
  const at = views.findIndex((v) => v.id === b.view);
  const next = views[(at + 1) % views.length];
  if (next === undefined) return none(s);
  return message(
    setBuffer(s, b.id, { view: next.id }),
    `mode: ${next.id}${next.readOnly === true ? " (read-only)" : ""}`,
  );
}

/** `<leader>x`: flip the cursor line's checkbox as one undo step. */
function toggleTask(c: CommandContext): Result {
  const s = c.state;
  const b = activeBuffer(s);
  const w = activeWindow(s);
  if (b === undefined || w === undefined) return none(s);
  const line = w.content.cursor.line;
  const m = TASK.exec(b.text.line(line));
  if (m === null) return message(s, "no checkbox on this line");
  if (readOnlyView(c.reg, b)) return message(s, readOnlyHint(b));
  const col = m[1]?.length ?? 0;
  const mark = m[2] ?? " ";
  const r = applyBufferEdits(
    s,
    {
      path: b.path,
      edits: [
        {
          range: { start: { line, col }, end: { line, col: col + 1 } },
          expected: mark,
          text: mark === " " ? "x" : " ",
        },
      ],
    },
    c.now,
    c.reg,
  );
  return { state: r.state, effects: r.effects };
}

/** `za`: fold or expand the callout or embed at the cursor in this window. */
function toggleFold(c: CommandContext): Result {
  const s = c.state;
  const b = activeBuffer(s);
  const w = activeWindow(s);
  const doc = b?.analysis as Doc | undefined;
  if (b === undefined || w === undefined || doc === undefined) return none(s);
  const line = w.content.cursor.line;
  const block = blocksIn(doc, { from: line, to: line + 1 })[0];
  const key = block && renderKey(block, doc, b.text);
  // Ids of blocks that no longer exist are dropped on every toggle.
  const ids = new Set(doc.blocks.map((x) => x.id));
  const live = (id: number) => ids.has(id);
  if (block === undefined || (key !== "callout" && key !== "embed")) {
    const folds = (w.content.folds ?? []).filter(live);
    return message(
      setWindow(s, { ...w, content: { ...w.content, folds } }),
      "nothing to fold here",
    );
  }
  return none(flipFold(s, w, block.id, live));
}

/** `Enter`: toggle the task on the cursor line, or follow the link under the cursor. */
function noteEnter(c: CommandContext): Result {
  const b = activeBuffer(c.state);
  const w = activeWindow(c.state);
  const onTask =
    b !== undefined &&
    w !== undefined &&
    TASK.test(b.text.line(w.content.cursor.line));
  return onTask ? toggleTask(c) : followLink(c);
}

export const markdownCommands: readonly AppCommand[] = [
  {
    id: "view.cycle",
    title: "Cycle live / source / reading",
    filetypes: ["markdown"],
    run: cycleView,
  },
  {
    id: "task.toggle",
    title: "Toggle task",
    filetypes: ["markdown"],
    run: toggleTask,
  },
  {
    id: "fold.toggle",
    title: "Fold or expand",
    filetypes: ["markdown"],
    run: toggleFold,
  },
  {
    id: "note.enter",
    title: "Toggle task or follow link",
    filetypes: ["markdown"],
    run: noteEnter,
  },
  {
    id: "preview.start",
    title: "Preview in browser",
    filetypes: ["markdown"],
    run: startPreview,
  },
  { id: "preview.stop", title: "Stop browser preview", run: stopPreview },
  {
    id: "image.zoom",
    title: "Zoom image or diagram",
    filetypes: ["markdown"],
    run: openZoom,
  },
  {
    id: "view.toggleReadable",
    title: "Toggle readable width",
    run: (c) => toggleReadable(c.state),
  },
  {
    id: "view.toggleJustify",
    title: "Toggle justified text",
    filetypes: ["markdown"],
    run: (c) => toggleJustify(c.state),
  },
  {
    id: "view.zoomIn",
    title: "Zoom note text in",
    filetypes: ["markdown"],
    run: (c) => zoomText(c.state, 1),
  },
  {
    id: "view.zoomOut",
    title: "Zoom note text out",
    filetypes: ["markdown"],
    run: (c) => zoomText(c.state, -1),
  },
  zoomKey("view.zoomInPlus", "+", 1),
  zoomKey("view.zoomInEqual", "=", 1),
  zoomKey("view.zoomOutMinus", "-", -1),
  {
    id: "view.zoomReset",
    title: "Reset note text zoom",
    filetypes: ["markdown"],
    run: (c) => zoomText(c.state, 0),
  },
];

const md = (mode: Mode) => ({ mode, filetype: "markdown" }) as const;

export const markdownBindings: readonly Binding[] = [
  { scope: md("normal"), seq: "<leader>m", id: "view.cycle" },
  { scope: md("normal"), seq: "<leader>x", id: "task.toggle" },
  { scope: md("normal"), seq: "za", id: "fold.toggle" },
  { scope: md("normal"), seq: "<CR>", id: "note.enter" },
  { scope: md("normal"), seq: "<leader>z", id: "image.zoom" },
  { scope: { mode: "normal" }, seq: "<leader>ur", id: "view.toggleReadable" },
  { scope: md("normal"), seq: "<leader>uj", id: "view.toggleJustify" },
  { scope: md("normal"), seq: "<leader>u+", id: "view.zoomIn" },
  // kitty's keyboard protocol reports Shift+= as "=".
  { scope: md("normal"), seq: "<leader>u=", id: "view.zoomIn" },
  { scope: md("normal"), seq: "<leader>u-", id: "view.zoomOut" },
  { scope: md("normal"), seq: "<leader>u0", id: "view.zoomReset" },
  { scope: md("normal"), seq: "+", id: "view.zoomInPlus" },
  { scope: md("normal"), seq: "=", id: "view.zoomInEqual" },
  { scope: md("normal"), seq: "-", id: "view.zoomOutMinus" },
];
