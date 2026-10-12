import { beforeEach, expect, test } from "bun:test";
import {
  layoutNote,
  noteView,
  stubCtx,
} from "../../../../test/support/markdown";
import { layoutText } from "../../kernel/view/text-view";
import type { RenderLine } from "../../kernel/view/types";
import { registerBlockRenderer } from "../../lang/markdown/live-preview";
import { builtinRenderers } from "../../lang/markdown/renderers/index";
import {
  type BaseEmbedData,
  baseEmbedOf,
  baseEmbedRenderer,
  isBaseEmbedModel,
} from "./embed";
import type { KanbanModel } from "./kanban";
import type { TableModel } from "./table";

beforeEach(() => {
  builtinRenderers();
  registerBlockRenderer("base", baseEmbedRenderer);
});

const NOTE = "# Today\n\n![[tasks.base#Board]]\n\nAfter\n";

function table(rows: number, groups: TableModel["groups"] = []): TableModel {
  return {
    columns: [
      {
        id: "file.name",
        label: "file.name",
        editable: false,
        type: "text",
        width: 9,
      },
    ],
    rows: Array.from({ length: rows }, (_, i) => ({
      path: `tasks/t${i}.md`,
      cells: [{ text: `t${i}`, value: { type: "string", value: `t${i}` } }],
    })),
    groups,
    summaries: [undefined],
    total: rows,
    diagnostics: [],
  };
}

/** The base widget the note's embed line renders to with `embedModel` answering `got`. */
function embedRow(got: unknown, view: "live" | "reading" = "live") {
  const rows = layoutNote(
    noteView(NOTE, { width: 80 }),
    view,
    stubCtx({
      resolve: (t) => (t === "tasks.base" ? "tasks.base" : undefined),
      embedModel: (path, subpath) =>
        path === "tasks.base" && subpath === "#Board" ? got : "missing",
    }),
  );
  const row = rows.find((r: RenderLine) => r.sourceLine === 2);
  return { row, data: row?.widget?.data as BaseEmbedData | undefined };
}

test("a base embed is capped at the configured rows with a more marker", () => {
  const model = baseEmbedOf("Board", { table: table(30) }, 10);
  const { row, data } = embedRow(model);
  expect(row?.widget?.type).toBe("base");
  // Title, column header, separator, ten rows, and the more marker.
  expect(row?.widget?.rows).toBe(1 + 2 + 10 + 1);
  expect(data).toEqual({ title: "tasks.base#Board", state: "ok", model });
  expect(model.more).toBe(20);
  expect(embedRow(model, "reading").row?.widget?.rows).toBe(14);
});

test("a short table and a board take only the rows they need", () => {
  expect(baseEmbedOf("All", { table: table(3) }, 10)).toMatchObject({
    bodyRows: 5,
    more: 0,
  });
  expect(baseEmbedOf("All", { table: table(0) }, 10).bodyRows).toBe(3);
  const grouped = table(12, [
    { key: "a", label: "a", start: 0, count: 6 },
    { key: "b", label: "b", start: 6, count: 6 },
  ]);
  // Ten lines: group a, six rows, group b, two rows; four rows hidden.
  expect(baseEmbedOf("All", { table: grouped }, 10).more).toBe(4);
  const card = (i: number) => ({
    path: `c${i}.md`,
    title: `c${i}`,
    fields: [],
  });
  const board: KanbanModel = {
    property: "status",
    movable: true,
    lanes: [
      {
        key: "todo",
        label: "todo",
        cards: Array.from({ length: 14 }, (_, i) => card(i)),
      },
      { key: "done", label: "done", cards: [card(99)] },
    ],
  };
  expect(baseEmbedOf("Board", { board }, 10)).toMatchObject({
    bodyRows: 1 + 10 + 1,
    more: 0,
  });
  const notice = baseEmbedOf("All", { notice: "◌ waiting for index" }, 10);
  expect(notice).toMatchObject({ bodyRows: 1, notice: "◌ waiting for index" });
  expect(embedRow(notice).row?.widget?.rows).toBe(2);
});

test("loading, missing, and invalid embeds render safely", () => {
  const loading = embedRow("loading");
  expect(loading.row?.widget?.rows).toBe(3);
  expect(loading.data).toEqual({ title: "tasks.base#Board", state: "loading" });

  const missing = embedRow("missing");
  expect(missing.row?.widget?.rows).toBe(2);
  expect(missing.data).toMatchObject({
    title: "tasks.base#Board",
    state: "missing",
  });
  expect(missing.data?.state === "missing" && missing.data.notice).toBeTruthy();

  for (const got of [{ rows: 3 }, undefined, "something"]) {
    const invalid = embedRow(got);
    expect(isBaseEmbedModel(got)).toBe(false);
    expect(invalid.row?.widget?.rows).toBe(2);
    expect(invalid.data?.state).toBe("missing");
  }

  const unresolved = layoutNote(
    noteView("![[nowhere.base]]\n\nAfter\n", {
      width: 80,
      cursor: { line: 2, col: 0 },
    }),
    "live",
    stubCtx({ resolve: () => undefined }),
  )[0];
  expect(unresolved?.widget?.type).toBe("base");
  expect(unresolved?.widget?.data).toMatchObject({ state: "missing" });
});

test("an embed inside an embedded note stays a link", () => {
  const inner = "Intro\n\n![[tasks.base#Board]]\n";
  const target = noteView(inner);
  const rows = layoutNote(
    noteView("![[inner]]\n\nAfter\n", {
      width: 80,
      cursor: { line: 2, col: 0 },
    }),
    "live",
    stubCtx({
      embed: () => ({ doc: target.doc, text: target.v.buf }),
      embedModel: () => baseEmbedOf("Board", { table: table(3) }, 10),
    }),
  );
  const embed = rows[0]?.widget?.data as { rows: { text: string }[][] };
  const texts = embed.rows.map((r) => r.map((s) => s.text).join(""));
  expect(texts).toContain("tasks.base#Board");
});

test("source view shows the embed's raw text", () => {
  const { v } = noteView(NOTE, { width: 80 });
  const rows = layoutText(v, [], undefined);
  const row = rows.find((r) => r.sourceLine === 2);
  expect(row?.widget).toBeUndefined();
  expect(row?.spans.map((s) => s.text).join("")).toBe("![[tasks.base#Board]]");
});
