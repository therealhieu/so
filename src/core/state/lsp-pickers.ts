import { resolveServers } from "../config/lsp";
import { rankBy } from "../kernel/text/fuzzy";
import type { Pos } from "../kernel/text/pos";
import type { DiagnosticSeverity } from "../kernel/view/diagnostics";
import { goTo, recordJump } from "./jumps";
import { mergedDiagnostics, request, runAction, serverDetail } from "./lsp";
import type { PickerSource } from "./picker";
import { none } from "./result";
import type { AppState, PickerItem } from "./types";

type Row = {
  key: string;
  text: string;
  detail?: string;
  path?: string;
  line?: number;
};

/** Rank rows on their text; an empty query keeps their order. */
const ranked = (rows: readonly Row[], query: string): PickerItem[] =>
  rankBy(rows, query, (r) => r.text).map(({ item, match }) => ({
    key: item.key,
    label: item.text,
    matches: match.positions,
    ...(item.detail === undefined ? {} : { detail: item.detail }),
    ...(item.path === undefined ? {} : { path: item.path }),
    ...(item.line === undefined ? {} : { line: item.line }),
  }));

const SEVERITY: Record<DiagnosticSeverity, string> = {
  1: "E",
  2: "W",
  3: "I",
  4: "H",
};

/** A row key that leads back to its position: `<line>:<col>:<n>:<path>`. */
const locationKey = (path: string, pos: Pos, n: number) =>
  `${pos.line}:${pos.col}:${n}:${path}`;

/** Close the picker, record a jump, and show the item's path at its position. */
const acceptLocation: PickerSource["accept"] = (s, item, now) => {
  const m = /^(\d+):(\d+):\d+:(.*)$/.exec(item.key);
  if (m === null) return none(s);
  const [, line, col, path] = m;
  const closed = recordJump({ ...s, overlay: { kind: "none" } });
  return goTo(
    closed,
    path ?? "",
    { line: Number(line), col: Number(col) },
    now,
  );
};
const previewLocation: PickerSource["preview"] = (item) =>
  item.path === undefined
    ? undefined
    : { path: item.path, line: item.line ?? 0 };

const at = (pos: Pos) => `${pos.line + 1}:${pos.col + 1}`;

/** Every diagnostic of every path, by severity, then path, then position. */
function diagnosticRows(s: AppState): Row[] {
  const all = Object.entries(s.lsp.diagnostics).flatMap(([path, byKey]) =>
    mergedDiagnostics(byKey).map((d) => ({ path, d })),
  );
  all.sort(
    (a, b) =>
      a.d.severity - b.d.severity ||
      (a.path < b.path ? -1 : a.path > b.path ? 1 : 0) ||
      a.d.range.start.line - b.d.range.start.line ||
      a.d.range.start.col - b.d.range.start.col,
  );
  return all.map(({ path, d }, n) => ({
    key: locationKey(path, d.range.start, n),
    text: `${SEVERITY[d.severity]} ${path}:${at(d.range.start)} ${d.message.split("\n", 1)[0] ?? ""}`,
    ...(d.source === undefined ? {} : { detail: d.source }),
    path,
    line: d.range.start.line,
  }));
}

/** One row per server and root, then the configured servers nothing started. */
function serverRows(s: AppState): Row[] {
  const specs = resolveServers(s.config.lsp);
  const views = Object.entries(s.lsp.servers);
  const started = new Set(views.map(([, v]) => v.name));
  return [
    ...views.map(([key, v]) => {
      const detail = serverDetail(v);
      return {
        key,
        text: `${v.name} · ${v.root ?? "(no project)"} · ${v.state}`,
        ...(detail === "" ? {} : { detail }),
      };
    }),
    ...specs
      .filter((spec) => !started.has(spec.name))
      .map((spec) => ({
        key: `\u0000${spec.name}`,
        text: `${spec.name} · not started`,
        detail: spec.command[0] ?? "",
      })),
  ];
}

/** Pickers over language-server state; each lists what a reducer stored. */
export const lspPickerSources: Readonly<Record<string, PickerSource>> = {
  diagnostics: {
    id: "diagnostics",
    title: "Diagnostics",
    items: (s, _r, q) => ranked(diagnosticRows(s), q),
    accept: acceptLocation,
    preview: previewLocation,
    empty: () => "no diagnostics",
  },
  lspLocations: {
    id: "lspLocations",
    title: "Locations",
    titleFor: (title) => title,
    items: (s, _r, q) =>
      ranked(
        (s.lsp.list?.items ?? []).map((l, n) => ({
          key: locationKey(l.path, l.range.start, n),
          text: `${l.path}:${at(l.range.start)}`,
          path: l.path,
          line: l.range.start.line,
        })),
        q,
      ),
    accept: acceptLocation,
    preview: previewLocation,
  },
  lspSymbols: {
    id: "lspSymbols",
    title: "Document symbols",
    items: (s, _r, q) => {
      const symbols = s.lsp.symbols;
      return symbols === undefined
        ? []
        : ranked(
            symbols.items.map((sym, n) => ({
              key: locationKey(symbols.path, sym.range.start, n),
              text: `${"  ".repeat(sym.depth)}${sym.name}`,
              detail: sym.kind,
              path: symbols.path,
              line: sym.range.start.line,
            })),
            q,
          );
    },
    accept: acceptLocation,
    preview: previewLocation,
  },
  lspActions: {
    id: "lspActions",
    title: "Code actions",
    action: "apply",
    items: (s, _r, q) =>
      ranked(
        (s.lsp.actions?.items ?? []).map((a, n) => ({
          key: String(n),
          text: a.title,
          ...(a.kind === undefined ? {} : { detail: a.kind }),
        })),
        q,
      ),
    accept: (s, item, now, reg) => {
      const actions = s.lsp.actions;
      const action = actions?.items[Number(item.key)];
      const closed: AppState = { ...s, overlay: { kind: "none" } };
      return actions === undefined || action === undefined
        ? none(closed)
        : runAction(closed, action, actions.key, now, reg);
    },
  },
  lspWorkspaceSymbols: {
    id: "lspWorkspaceSymbols",
    title: "Workspace symbols",
    // The server matches the query; its order is kept.
    items: (s) =>
      ranked(
        (s.lsp.workspaceSymbols ?? []).map((sym, n) => ({
          key: locationKey(sym.path, sym.range.start, n),
          text: sym.name,
          detail: `${sym.kind} ${sym.path}:${at(sym.range.start)}`,
          path: sym.path,
          line: sym.range.start.line,
        })),
        "",
      ),
    accept: acceptLocation,
    preview: previewLocation,
    search: (s, query) =>
      request(
        s,
        "workspaceSymbols",
        { kind: "workspaceSymbols", query },
        { auto: true, replace: true },
      ),
    empty: () => "type to search symbols",
  },
  lspInfo: {
    id: "lspInfo",
    title: "Language servers",
    action: "close",
    items: (s, _r, q) => ranked(serverRows(s), q),
    accept: (s) => none({ ...s, overlay: { kind: "none" } }),
    empty: () => "no language servers configured",
  },
};
