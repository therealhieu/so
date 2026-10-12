import {
  annotationTop,
  byReading,
  type PdfAnnotation,
} from "../features/pdf/annotations";
import { rankBy } from "../kernel/text/fuzzy";
import { activeBuffer } from "./buffers";
import { pdfWindow, showPdfAt, showPdfPage } from "./pdf";
import { askNote, removeAnnotation } from "./pdf-annotate";
import { yankText } from "./pdf-tools";
import type { PickerSource, PreviewLines } from "./picker";
import { message, none } from "./result";
import type { AppState, PickerItem } from "./types";

type Row = { key: string; text: string; detail: string };

/** The active PDF's contents, indented by level; keys are `<n>:<page>`. */
function rows(s: AppState): Row[] {
  const o = activeBuffer(s)?.pdfOutline;
  if (o?.status !== "ready") return [];
  return o.value.map((item, i) => ({
    key: `${i}:${item.page}`,
    text: `${"  ".repeat(item.depth)}${item.title}`,
    detail: `p. ${item.page}`,
  }));
}

type Listed = { item: PdfAnnotation; detached: boolean };

/** The active PDF's highlights and notes in reading order, the detached last. */
function annotations(s: AppState): Listed[] {
  const pdf = activeBuffer(s)?.path;
  const load = pdf === undefined ? undefined : s.annotations[pdf];
  if (load?.status !== "ready") return [];
  const gone = new Set(load.detached ?? []);
  const sorted = [...load.items].sort(byReading);
  return [
    ...sorted.filter((i) => !gone.has(i.id)),
    ...sorted.filter((i) => gone.has(i.id)),
  ].map((item) => ({ item, detached: gone.has(item.id) }));
}

const annotationRows = (s: AppState): Row[] =>
  annotations(s).map(({ item: i, detached }) => ({
    key: i.id,
    text: `${i.kind === "note" ? "✎" : "▍"} ${[i.quote, i.note]
      .filter((t) => t !== undefined)
      .join(" — ")
      .replace(/\s+/g, " ")}`,
    detail: `p. ${i.page}${detached ? " · detached" : ""}`,
  }));

const listedOf = (s: AppState, item: PickerItem) =>
  annotations(s).find((a) => a.item.id === item.key);

/** The highlight or note behind picker row `item`, with its PDF. */
function annotationOf(
  s: AppState,
  item: PickerItem,
): { pdf: string; a: PdfAnnotation } | undefined {
  const pdf = activeBuffer(s)?.path;
  const a = listedOf(s, item)?.item;
  return pdf === undefined || a === undefined ? undefined : { pdf, a };
}

/** The page, the whole quote, and the whole note, wrapped to the pane. */
function describeAnnotation(s: AppState, item: PickerItem): PreviewLines {
  const got = listedOf(s, item);
  if (got === undefined) return [];
  const { item: a, detached } = got;
  return [
    {
      text: `${a.kind === "note" ? "Note" : "Highlight"} · page ${a.page}`,
      style: "floatTitle",
    },
    ...(detached
      ? [
          {
            text: `its text is no longer on page ${a.page}`,
            style: "floatDim",
            wrap: true as const,
          },
        ]
      : []),
    { text: "" },
    { text: a.quote.replace(/\s+/g, " "), wrap: true as const },
    ...(a.note === undefined
      ? []
      : [
          { text: "" },
          { text: `→ ${a.note}`, style: "floatDim", wrap: true as const },
        ]),
  ];
}

/** The first annotation on or after the shown page, else the last one before it. */
function atShownPage(s: AppState): number {
  const page = pdfWindow(s, s.windows.active)?.page ?? 1;
  const attached = annotations(s).filter((a) => !a.detached);
  const at = attached.findIndex((a) => a.item.page >= page);
  return at >= 0 ? at : Math.max(0, attached.length - 1);
}

const ranked = (all: readonly Row[], query: string): PickerItem[] =>
  rankBy(all, query, (r) => r.text).map(({ item, match }) => ({
    key: item.key,
    label: item.text,
    detail: item.detail,
    matches: match.positions,
  }));

export const pdfPickerSources: Record<string, PickerSource> = {
  pdfOutline: {
    id: "pdfOutline",
    title: "Contents",
    action: "go",
    items: (s, _r, q) => ranked(rows(s), q),
    total: (s) => rows(s).length,
    empty: (s) => {
      const o = activeBuffer(s)?.pdfOutline;
      if (o === undefined || o.status === "loading") return "Loading contents…";
      if (o.status === "failed") return `No contents: ${o.reason}`;
      return "This PDF has no table of contents";
    },
    accept: (s, item) =>
      none(
        showPdfPage(
          { ...s, overlay: { kind: "none" } },
          s.windows.active,
          Number(item.key.split(":")[1]),
        ),
      ),
  },
  pdfAnnotations: {
    id: "pdfAnnotations",
    title: "Highlights and notes",
    action: "go",
    items: (s, _r, q) => ranked(annotationRows(s), q),
    total: (s) => annotations(s).length,
    empty: (s) => {
      const pdf = activeBuffer(s)?.path;
      const a = pdf === undefined ? undefined : s.annotations[pdf];
      if (a === undefined || a.status === "loading")
        return "Reading the annotations…";
      if (a.status === "failed") return `No annotations: ${a.reason}`;
      return "No highlights or notes in this PDF";
    },
    initial: atShownPage,
    describe: describeAnnotation,
    accept: (s, item) => {
      const got = listedOf(s, item);
      const closed: AppState = { ...s, overlay: { kind: "none" } };
      if (got === undefined) return none(closed);
      const { item: a, detached } = got;
      const shown = showPdfAt(
        closed,
        s.windows.active,
        a.page,
        annotationTop(a),
      );
      return detached
        ? message(shown, `its text is no longer on page ${a.page}`, "warn")
        : none(shown);
    },
    edit: (s, item) => {
      const got = annotationOf(s, item);
      return got === undefined ? none(s) : askNote(s, got.pdf, got.a);
    },
    editAction: "note",
    copy: (s, item) => {
      const got = annotationOf(s, item);
      return got === undefined
        ? none(s)
        : yankText(s, got.a.quote, "copied the annotated text");
    },
    remove: (s, item) => {
      const got = annotationOf(s, item);
      return got === undefined ? none(s) : removeAnnotation(s, got.pdf, got.a);
    },
    removeAction: "delete",
  },
};
