import type { BaseWindowState, CellEdit } from "../features/bases/file-type";
import {
  type PropertyType,
  propertyType,
  validates,
} from "../features/bases/property-types";
import type { Binding } from "../kernel/commands/defaults";
import type { Command } from "../kernel/commands/registry";
import type { Key } from "../kernel/vim/keys";
import type { FrontmatterValue } from "../lang/markdown/frontmatter-patch";
import { addDays } from "../time/local";
import {
  type BaseViewModel,
  baseViewModel,
  baseWindow,
  selectBaseView,
  setBaseWindow,
} from "./base-model";
import { writeProperty } from "./base-write";
import { openPath } from "./buffers";
import type { CommandContext, CommandResult } from "./commands";
import { recordJump } from "./jumps";
import { openPicker } from "./picker";
import { message, none, toast } from "./result";
import type { AppState, Result, WindowId } from "./types";
import type { Registries } from "./update";

type BaseCommand = Command<CommandContext, CommandResult>;

/** The active base window: its id, state, and current model. */
type Active = {
  s: AppState;
  id: WindowId;
  ws: BaseWindowState;
  m: BaseViewModel;
};

function active(c: CommandContext): Active | undefined {
  const s = c.state;
  const id = s.windows.active;
  const ws = baseWindow(s, id);
  const m = baseViewModel(s, id, c.reg);
  return ws === undefined || m === undefined ? undefined : { s, id, ws, m };
}

const clamp = (n: number, max: number) => Math.max(0, Math.min(n, max));

/** A note property without its `note.` prefix, as frontmatter names it. */
const bare = (property: string) => property.replace(/^note\./, "");

/** The value the index holds for `property` of the note at `path`. */
function shownValue(
  s: AppState,
  path: string,
  property: string,
): FrontmatterValue | undefined {
  const fm = s.index.ix.summaries.get(path)?.frontmatter ?? {};
  const lower = property.toLowerCase();
  const key =
    property in fm
      ? property
      : Object.keys(fm).find((k) => k.toLowerCase() === lower);
  return key === undefined ? undefined : (fm[key] as FrontmatterValue);
}

const setWs = (a: Active, ws: BaseWindowState): AppState =>
  setBaseWindow(a.s, a.id, ws);

/** Focus a table cell and echo it as `column: value`. */
function focusCell(a: Active, row: number, column: number): Result {
  const t = a.m.table;
  if (t === undefined) return none(a.s);
  const r = t.rows[row];
  const col = t.columns[column];
  const ws: BaseWindowState = {
    ...a.ws,
    focus: {
      ...(r === undefined ? {} : { path: r.path }),
      column,
    },
  };
  const text = r?.cells[column]?.text ?? "";
  return col === undefined
    ? none(setWs(a, ws))
    : message(setWs(a, ws), `${col.label}: ${text === "" ? "—" : text}`);
}

/** Focus a card and echo it as `lane · title`. */
function focusCard(a: Active, lane: number, card: number): Result {
  const l = a.m.board?.lanes[lane];
  if (l === undefined) return none(a.s);
  const c = l.cards[card];
  const ws: BaseWindowState = {
    ...a.ws,
    focus: { ...(c === undefined ? {} : { path: c.path }), column: lane },
  };
  return message(
    setWs(a, ws),
    c === undefined ? `${l.label} · empty` : `${l.label} · ${c.title}`,
  );
}

function moveFocus(c: CommandContext, dRow: number, dCol: number): Result {
  const a = active(c);
  if (a === undefined) return none(c.state);
  const { focus, table, board } = a.m;
  if (board !== undefined) {
    const lane = clamp(focus.lane + dCol, board.lanes.length - 1);
    const cards = board.lanes[lane]?.cards.length ?? 0;
    const card = dCol !== 0 ? 0 : clamp(focus.card + dRow, cards - 1);
    return focusCard(a, lane, card);
  }
  if (table === undefined) return none(a.s);
  return focusCell(
    a,
    clamp(focus.row + dRow, table.rows.length - 1),
    clamp(focus.column + dCol, table.columns.length - 1),
  );
}

/** The focused table cell's note, property, and column, when there is a row. */
function focusedCell(a: Active) {
  const t = a.m.table;
  const row = t?.rows[a.m.focus.row];
  const col = t?.columns[a.m.focus.column];
  return row === undefined || col === undefined
    ? undefined
    : { path: row.path, col, property: bare(col.id) };
}

const READ_ONLY_WHY = (id: string) =>
  id.startsWith("formula.") ? "formula" : "file property";

/** Text a value is edited as: lists comma-separated, absent values empty. */
function editText(v: FrontmatterValue | undefined): string {
  if (v === undefined || v === null) return "";
  return Array.isArray(v) ? v.map((x) => String(x)).join(", ") : String(v);
}

function startEdit(c: CommandContext): Result {
  const a = active(c);
  if (a === undefined) return none(c.state);
  if (a.m.table === undefined)
    return message(a.s, "cells are edited in a table view");
  const cell = focusedCell(a);
  if (cell === undefined) return none(a.s);
  if (!cell.col.editable)
    return message(
      a.s,
      `${cell.col.label} — ${READ_ONLY_WHY(cell.col.id)}, read only`,
    );
  const original = shownValue(a.s, cell.path, cell.property);
  const type =
    original === undefined || original === null
      ? cell.col.type
      : propertyType(cell.property, original, a.s.index.types);
  if (type === "checkbox") return toggleCheckbox(c);
  const value = editText(original);
  const edit: CellEdit = {
    path: cell.path,
    property: cell.property,
    type,
    value,
    caret: value.length,
    original,
  };
  return none(setWs(a, { ...a.ws, edit }));
}

function toggleCheckbox(c: CommandContext): Result {
  const a = active(c);
  if (a === undefined) return none(c.state);
  const cell = focusedCell(a);
  const value =
    cell === undefined ? undefined : shownValue(a.s, cell.path, cell.property);
  const checkbox =
    cell !== undefined &&
    cell.col.editable &&
    (typeof value === "boolean" ||
      ((value === undefined || value === null) &&
        cell.col.type === "checkbox"));
  if (!checkbox) return message(a.s, "x toggles checkbox cells");
  return writeProperty(
    a.s,
    cell.path,
    { set: cell.property, value: value !== true },
    value,
    c.now,
    c.reg,
  );
}

/** `s` on a column: ascending, then descending, then the view's own sort. */
function cycleSort(c: CommandContext): Result {
  const a = active(c);
  const col = a?.m.table?.columns[a.m.focus.column];
  if (a === undefined || col === undefined)
    return message(c.state, "sort works on a table column");
  const cur = a.ws.sort?.property === col.id ? a.ws.sort.direction : undefined;
  const next = cur === undefined ? "ASC" : cur === "ASC" ? "DESC" : undefined;
  const { sort: _, ...rest } = a.ws;
  const ws: BaseWindowState =
    next === undefined
      ? rest
      : { ...rest, sort: { property: col.id, direction: next } };
  const how =
    next === undefined
      ? "the view's order"
      : `${col.label} ${next === "ASC" ? "ascending" : "descending"}`;
  return message(setWs(a, ws), `sort: ${how} (this window only)`);
}

function toggleGrouping(c: CommandContext): Result {
  const a = active(c);
  if (a === undefined) return none(c.state);
  const { grouped, ...rest } = a.ws;
  const ws: BaseWindowState =
    grouped === false ? rest : { ...rest, grouped: false };
  return message(
    setWs(a, ws),
    `grouping ${grouped === false ? "on" : "off"} (this window only)`,
  );
}

function toggleFilter(c: CommandContext): Result {
  const a = active(c);
  if (a === undefined) return none(c.state);
  const { filtered, ...rest } = a.ws;
  const ws: BaseWindowState =
    filtered === false ? rest : { ...rest, filtered: false };
  return message(
    setWs(a, ws),
    `view filters ${filtered === false ? "on" : "off"} (this window only)`,
  );
}

function switchView(c: CommandContext, pick: (a: Active) => number): Result {
  const a = active(c);
  if (a === undefined) return none(c.state);
  const view = a.m.views[pick(a)];
  return view === undefined
    ? none(a.s)
    : none(selectBaseView(a.s, a.id, view.name));
}

const nextView = (a: Active) =>
  (a.m.views.findIndex((v) => v.name === a.m.selected) + 1) %
  Math.max(1, a.m.views.length);

const EXPLAIN_FIXED = {
  formula: "Moves are off: this board groups by a formula",
  file: "Moves are off: this board groups by a file property",
} as const;

/**
 * `H`/`L`: on a board, move the focused card to the next lane by writing the
 * group property (removing it for None); the card keeps focus. On a table,
 * scroll the columns.
 */
function moveCard(c: CommandContext, step: -1 | 1): Result {
  const a = active(c);
  if (a === undefined) return none(c.state);
  const board = a.m.board;
  if (board === undefined) {
    const cols = a.m.table?.columns.length ?? 0;
    const col = clamp(a.ws.scroll.col + step, cols - 1);
    return none(
      setWs(a, {
        ...a.ws,
        scroll: { ...a.ws.scroll, col },
        focus: { ...a.ws.focus, column: Math.max(a.m.focus.column, col) },
      }),
    );
  }
  if (!board.movable)
    return toast(a.s, "info", EXPLAIN_FIXED[board.why ?? "formula"]);
  const { lane, card } = a.m.focus;
  const target = board.lanes[lane + step];
  const moved = board.lanes[lane]?.cards[card];
  if (target === undefined || moved === undefined) return none(a.s);
  const property = bare(board.property);
  const expected = shownValue(a.s, moved.path, property);
  const date =
    typeof target.key === "string" &&
    propertyType(property, target.key, a.s.index.types) === "date";
  const focused = setWs(a, {
    ...a.ws,
    focus: { path: moved.path, column: lane + step },
  });
  return writeProperty(
    focused,
    moved.path,
    target.key === null
      ? { remove: property }
      : { set: property, value: target.key, ...(date ? { date } : {}) },
    expected,
    c.now,
    c.reg,
  );
}

function openFocused(c: CommandContext): Result {
  const a = active(c);
  if (a === undefined) return none(c.state);
  const path =
    a.m.board?.lanes[a.m.focus.lane]?.cards[a.m.focus.card]?.path ??
    a.m.table?.rows[a.m.focus.row]?.path;
  return path === undefined
    ? none(a.s)
    : openPath(recordJump(a.s), path, c.now);
}

const BASE = ["base"] as const;
const cmd = (
  id: string,
  title: string,
  f: (c: CommandContext) => Result,
): BaseCommand => ({ id, title, filetypes: BASE, run: f });

export const baseCommands: readonly BaseCommand[] = [
  cmd("base.left", "Focus the cell or lane to the left", (c) =>
    moveFocus(c, 0, -1),
  ),
  cmd("base.right", "Focus the cell or lane to the right", (c) =>
    moveFocus(c, 0, 1),
  ),
  cmd("base.up", "Focus the row or card above", (c) => moveFocus(c, -1, 0)),
  cmd("base.down", "Focus the row or card below", (c) => moveFocus(c, 1, 0)),
  cmd("base.edit", "Edit the focused cell", startEdit),
  cmd("base.toggle", "Toggle the focused checkbox cell", toggleCheckbox),
  cmd("base.sort", "Sort by the focused column", cycleSort),
  cmd("base.group", "Toggle grouping", toggleGrouping),
  cmd("base.filter", "Toggle the view's filters", toggleFilter),
  cmd("base.views", "List the base's views", (c) => openPicker(c, "baseViews")),
  cmd("base.nextView", "Show the next view", (c) => switchView(c, nextView)),
  ...[1, 2, 3, 4].map((n) =>
    cmd(`base.view${n}`, `Show view ${n}`, (c) => switchView(c, () => n - 1)),
  ),
  cmd("base.moveLeft", "Move the card to the lane on the left", (c) =>
    moveCard(c, -1),
  ),
  cmd("base.moveRight", "Move the card to the lane on the right", (c) =>
    moveCard(c, 1),
  ),
  cmd("base.open", "Open the focused note", openFocused),
];

const KEYS: readonly (readonly [string, string])[] = [
  ["h", "base.left"],
  ["l", "base.right"],
  ["k", "base.up"],
  ["j", "base.down"],
  ["i", "base.edit"],
  ["x", "base.toggle"],
  ["s", "base.sort"],
  ["g", "base.group"],
  ["f", "base.filter"],
  ["v", "base.views"],
  ["<Tab>", "base.nextView"],
  ["1", "base.view1"],
  ["2", "base.view2"],
  ["3", "base.view3"],
  ["4", "base.view4"],
  ["H", "base.moveLeft"],
  ["L", "base.moveRight"],
  ["<CR>", "base.open"],
];

export const baseBindings: readonly Binding[] = KEYS.map(([seq, id]) => ({
  scope: { mode: "normal", filetype: "base" },
  seq,
  id,
}));

/** Whether the active window is editing a base cell; its keys go to `cellEditKey`. */
export const editingCell = (s: AppState): boolean =>
  baseWindow(s, s.windows.active)?.edit !== undefined;

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** `Ctrl-a`/`Ctrl-x`: step a number by one, or a date by one day. */
function stepped(e: CellEdit, n: 1 | -1): string {
  if (e.type === "number") {
    const v = Number(e.value.trim());
    return e.value.trim() !== "" && Number.isFinite(v)
      ? String(v + n)
      : e.value;
  }
  const d = DATE.exec(e.value.trim());
  if ((e.type !== "date" && e.type !== "datetime") || d === null)
    return e.value;
  const next = addDays(
    { year: Number(d[1]), month: Number(d[2]), day: Number(d[3]) },
    n,
  );
  return `${pad(next.year, 4)}-${pad(next.month)}-${pad(next.day)}`;
}

/** The typed value of `text` for a property of `type`, or why it is not one. */
export function validateCell(
  type: PropertyType,
  text: string,
): { ok: true; value: FrontmatterValue } | { ok: false; error: string } {
  const t = text.trim();
  if (t === "" && type !== "checkbox") return { ok: true, value: null };
  switch (type) {
    case "number": {
      const n = Number(t);
      return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) &&
        Number.isFinite(n)
        ? { ok: true, value: n }
        : { ok: false, error: "not a number" };
    }
    case "checkbox":
      return t === "true" || t === "false"
        ? { ok: true, value: t === "true" }
        : { ok: false, error: "use true or false" };
    case "date":
      return validates("date", t)
        ? { ok: true, value: t }
        : { ok: false, error: "use YYYY-MM-DD" };
    case "datetime":
      return validates("datetime", t)
        ? { ok: true, value: t }
        : { ok: false, error: "use YYYY-MM-DDTHH:mm" };
    case "text":
      return { ok: true, value: t };
    default:
      return {
        ok: true,
        value: t
          .split(",")
          .map((x) => x.trim())
          .filter((x) => x !== ""),
      };
  }
}

/** Enter: write a valid value (nothing when unchanged); an invalid one stays with its error. */
function commitCellEdit(
  s: AppState,
  ws: BaseWindowState,
  e: CellEdit,
  now: number,
  reg: Registries,
): Result {
  const v = validateCell(e.type, e.value);
  const id = s.windows.active;
  if (!v.ok)
    return none(
      setBaseWindow(s, id, { ...ws, edit: { ...e, error: v.error } }),
    );
  const { edit: _, ...rest } = ws;
  const closed = setBaseWindow(s, id, rest);
  if (JSON.stringify(v.value) === JSON.stringify(e.original ?? null))
    return none(closed);
  return writeProperty(
    closed,
    e.path,
    {
      set: e.property,
      value: v.value,
      ...(e.type === "date" && v.value !== null ? { date: true } : {}),
    },
    e.original,
    now,
    reg,
  );
}

/**
 * A key while a cell is being edited: characters, Backspace, and the arrows
 * edit the text; `Ctrl-a`/`Ctrl-x` step numbers and dates; Esc drops the
 * edit; Enter writes it. No other key reaches base commands or vim.
 */
export function cellEditKey(
  s: AppState,
  a: { key: Key; now: number },
  reg: Registries,
): Result {
  const id = s.windows.active;
  const ws = baseWindow(s, id);
  const e = ws?.edit;
  if (ws === undefined || e === undefined) return none(s);
  const set = (edit: CellEdit) => {
    const { error: _, ...clean } = edit;
    return none(setBaseWindow(s, id, { ...ws, edit: clean }));
  };
  const { value, caret } = e;
  switch (a.key) {
    case "<Esc>": {
      const { edit: _, ...rest } = ws;
      return none(setBaseWindow(s, id, rest));
    }
    case "<CR>":
      return commitCellEdit(s, ws, e, a.now, reg);
    case "<BS>":
      return caret === 0
        ? none(s)
        : set({
            ...e,
            value: value.slice(0, caret - 1) + value.slice(caret),
            caret: caret - 1,
          });
    case "<Left>":
      return set({ ...e, caret: Math.max(0, caret - 1) });
    case "<Right>":
      return set({ ...e, caret: Math.min(value.length, caret + 1) });
    case "<C-a>":
    case "<C-x>": {
      const next = stepped(e, a.key === "<C-a>" ? 1 : -1);
      return set({ ...e, value: next, caret: next.length });
    }
    default:
      return [...a.key].length === 1
        ? set({
            ...e,
            value: value.slice(0, caret) + a.key + value.slice(caret),
            caret: caret + a.key.length,
          })
        : none(s);
  }
}
