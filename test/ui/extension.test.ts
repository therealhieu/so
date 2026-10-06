import { afterEach, expect, test } from "bun:test";
import type { OptimizedBuffer } from "@opentui/core";
import type { FileType } from "../../src/core/filetypes/registry";
import type { Command } from "../../src/core/kernel/commands/registry";
import type { DecorationProvider } from "../../src/core/kernel/view/decorations";
import type { Highlighter, Span } from "../../src/core/kernel/view/types";
import { embedLink, wholeBlock } from "../../src/core/lang/markdown/block-text";
import { registerBlockRenderer } from "../../src/core/lang/markdown/live-preview";
import {
  type MdNode,
  type SyntaxExtension,
  syntaxExtensions,
} from "../../src/core/lang/markdown/syntax";
import { activeBuffer, activeWindow } from "../../src/core/state/buffers";
import type {
  CommandContext,
  CommandResult,
} from "../../src/core/state/commands";
import { message } from "../../src/core/state/result";
import type { Registries } from "../../src/core/state/update";
import type { ViewHost } from "../../src/core/state/view-context";
import { editorViews, registerEditorView } from "../../src/ui/editors/registry";
import { EditorView } from "../../src/ui/editors/text-view";
import { drawCells, themeOf } from "../../src/ui/theme";
import {
  registerWidgetPainter,
  widgetPainters,
} from "../../src/ui/widgets/registry";
import { testRegistries } from "../support/state";
import { cellStyle, type Mounted, mountShell } from "../support/ui";

type AppCommand = Command<CommandContext, CommandResult>;

let m: Mounted | undefined;
const cleanups: (() => void)[] = [];
afterEach(() => {
  m?.destroy();
  m = undefined;
  for (const undo of cleanups.splice(0)) undo();
});

/** Mount on `reg` with the explorer closed. */
async function mount(reg: Registries): Promise<Mounted> {
  const x = await mountShell({ cols: 100, rows: 20, reg });
  x.keys("<leader>e");
  return x;
}

/** Each comma-separated cell alternates between two styles. */
const csvHighlighter: Highlighter = {
  language: "csv",
  highlight(buf, lines) {
    const out: Span[][] = [];
    for (let l = lines.from; l < Math.min(lines.to, buf.lineCount); l++)
      out.push(
        buf
          .line(l)
          .split(/(,)/)
          .map((text, i) => ({
            text,
            style: i % 4 === 0 ? "codeKeyword" : "codeString",
          })),
      );
    return out;
  },
};

type CsvInput = { columns: number; ctx: { width: number } };

/** The header row shows its column count and the window width the view context reported. */
const csvHeader: DecorationProvider<CsvInput> = (v, { columns, ctx }) =>
  v.visible.from > 0
    ? []
    : [
        {
          kind: "replace",
          range: {
            start: { line: 0, col: 0 },
            end: { line: 0, col: v.buf.line(0).length },
          },
          block: false,
          spans: [
            { text: `${columns} columns at ${ctx.width}`, style: "mdBold" },
          ],
        },
        { kind: "line", line: 0, sign: { text: "▸", style: "signReveal" } },
      ];

const csvFileType: FileType<number> = {
  id: "csv",
  match: { extensions: [".csv"] },
  editor: "text",
  views: [
    {
      id: "table",
      decorations: [csvHeader as DecorationProvider<unknown>],
      input: (columns, ctx) => ({ columns, ctx }) as unknown as number,
    },
    { id: "source", decorations: [] },
  ],
  highlighter: csvHighlighter,
  analyze: (buf) => buf.line(0).split(",").length,
};

const csvCount: AppCommand = {
  id: "csv.count",
  title: "CSV: count rows",
  filetypes: ["csv"],
  run: (c) => {
    const b = activeBuffer(c.state);
    return message(c.state, `${(b?.text.lineCount ?? 1) - 1} data rows`);
  },
};

test("a csv file type works by registration alone", async () => {
  const reg = testRegistries();
  const hosts: ViewHost[] = [];
  reg.fileTypes.register(csvFileType);
  reg.viewContexts.register("csv", (_s, _w, host) => {
    hosts.push(host);
    return { width: host.width };
  });
  reg.commands.register(csvCount);
  reg.bindings = [
    ...reg.bindings,
    { scope: { mode: "normal", filetype: "csv" }, seq: "gC", id: "csv.count" },
  ];
  m = await mount(reg);
  m.open("data.csv", "name,qty,price\napple,3,1.20\npear,5,0.80\n");
  expect(activeBuffer(m.store.get())).toMatchObject({
    fileType: "csv",
    view: "table",
  });

  const frame = (await m.frame()).split("\n");
  const width = hosts.at(-1)?.width;
  expect(width).toBeGreaterThan(0);
  const header = frame.find((r) => r.includes("3 columns at"));
  expect(header).toContain(`▸3 columns at ${width}`);
  const row = frame.findIndex((r) => r.includes("apple,3,1.20"));
  const x = frame[row]?.indexOf("apple") ?? -1;
  const lines = m.t.captureSpans().lines;
  const name = cellStyle(lines, x, row);
  const comma = cellStyle(lines, x + "apple".length, row);
  const qty = cellStyle(lines, x + "apple,".length, row);
  expect(name?.fg).not.toBe(comma?.fg);
  expect(qty).toEqual(comma);

  m.keys("gC");
  expect(await m.message()).toContain("2 data rows");
});

test("a csv key stays unbound outside csv files", async () => {
  const reg = testRegistries();
  reg.fileTypes.register(csvFileType);
  reg.commands.register(csvCount);
  reg.bindings = [
    ...reg.bindings,
    { scope: { mode: "normal", filetype: "csv" }, seq: "gC", id: "csv.count" },
  ];
  m = await mount(reg);
  m.open("notes/plan.md", "# Plan\n\nText.\n");
  m.keys("gC");
  expect(await m.message()).not.toContain("data rows");
});

/** `@grid(name)` alone on a line becomes an embed of `name.xgrid`. */
const gridSyntax: SyntaxExtension = {
  name: "gridRef",
  transform(tree) {
    const visit = (node: MdNode) => {
      for (const [i, child] of (node.children ?? []).entries()) {
        const hit =
          child.type === "text" && /^@grid\((\w+)\)$/.exec(child.value ?? "");
        if (hit && node.children)
          node.children[i] = {
            type: "embed",
            target: `${hit[1]}.xgrid`,
            position: child.position,
          };
        else visit(child);
      }
    };
    visit(tree);
  },
};

const gridHello: AppCommand = {
  id: "grid.hello",
  title: "Grid: say hello",
  run: (c) => message(c.state, "hello from the grid"),
};

test("a command, syntax, block renderer, and widget painter extend the editor by registration alone", async () => {
  syntaxExtensions.push(gridSyntax);
  cleanups.push(() =>
    syntaxExtensions.splice(syntaxExtensions.indexOf(gridSyntax), 1),
  );
  registerBlockRenderer("xgrid", (block, v, { doc }) => [
    {
      kind: "replace",
      range: wholeBlock(v.buf, block),
      block: true,
      widget: {
        type: "xgrid",
        data: { name: embedLink(doc, block, v.buf).target },
        rows: 2,
      },
    },
  ]);
  registerWidgetPainter("xgrid", (t, w) => {
    const { name } = w.data as { name: string };
    drawCells(
      t.buf,
      t.theme.style("mdBold"),
      t.x,
      t.y,
      `GRID ${name}`,
      t.width,
    );
    drawCells(t.buf, t.theme.style("text"), t.x, t.y + 1, "└─┴─┘", t.width);
  });
  cleanups.push(() => widgetPainters.delete("xgrid"));
  const reg = testRegistries();
  reg.commands.register(gridHello);
  reg.bindings = [
    ...reg.bindings,
    { scope: { mode: "normal" }, seq: "gH", id: "grid.hello" },
  ];
  m = await mount(reg);
  m.open("notes/plan.md", "# Plan\n\n@grid(sales)\n\nAfter.\n");

  const frame = await m.frame();
  expect(frame).toContain("GRID sales.xgrid");
  expect(frame).toContain("└─┴─┘");
  expect(frame).not.toContain("@grid(sales)");

  m.keys("gH");
  expect(await m.message()).toContain("hello from the grid");
  m.keys("<leader>:Grid: say<CR>");
  expect(m.store.get().overlay.kind).toBe("none");
  expect(await m.message()).toContain("hello from the grid");
});

/** A grid editor's view: one header row naming the shown file's line count. */
class GridView extends EditorView {
  protected override renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    const w = s?.windows.byId[this.windowId];
    const b = w && s?.buffers[w.content.bufferId];
    if (s === undefined || b === undefined) return;
    drawCells(
      buf,
      themeOf(s).style("mdBold"),
      this.x,
      this.y,
      `GRID VIEW ${b.text.lineCount} rows`,
      this.width,
    );
  }
}

const gridFileType: FileType = {
  id: "grid",
  match: { extensions: [".grid"] },
  editor: "grid",
  views: [{ id: "cells", decorations: [] }],
};

test("a grid editor kind opens its files in its own registered view", async () => {
  registerEditorView("grid", (ctx, deps) => new GridView(ctx, deps));
  cleanups.push(() => editorViews.delete("grid"));
  const reg = testRegistries();
  reg.editorKinds.register({ id: "grid", open: (_path, text) => text });
  reg.fileTypes.register(gridFileType);
  m = await mount(reg);
  m.open("t.grid", "a,b\n1,2\n3,4\n");
  expect(activeWindow(m.store.get())?.content.editor).toBe("grid");
  expect(await m.frame()).toContain("GRID VIEW 3 rows");

  m.open("notes/plan.md", "# Plan\n");
  expect(activeWindow(m.store.get())?.content.editor).toBe("text");
  const frame = await m.frame();
  expect(frame).toContain("# Plan");
  expect(frame).not.toContain("GRID VIEW");
});

test("a file type naming an unregistered editor kind opens as text", async () => {
  const reg = testRegistries();
  reg.fileTypes.register({
    ...gridFileType,
    id: "sheet",
    match: { extensions: [".sheet"] },
    editor: "sheet",
  });
  m = await mount(reg);
  m.open("t.sheet", "a,b\n");
  expect(activeWindow(m.store.get())?.content.editor).toBe("text");
  expect(await m.frame()).toContain("a,b");
});
