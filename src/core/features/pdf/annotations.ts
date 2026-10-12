import {
  charEdges,
  type PdfPageLayout,
  type PdfPoint,
  type PdfSelection,
  type PdfWord,
  selectedWords,
  selectionText,
} from "./layout";

/**
 * A highlight or a note on a PDF page: the text a selection covered, kept
 * as that selection plus the text it held (`quote`), so it can be found
 * again when the PDF changes.
 */
export type PdfAnnotation = PdfSelection & {
  id: string;
  kind: "highlight" | "note";
  quote: string;
  note?: string;
  /** ISO 8601 times. */
  created: string;
  updated?: string;
};

const VERSION = 1;

/** Where the annotations of the workspace PDF `pdf` are kept. */
export const annotationsPath = (pdf: string): string =>
  `.so/annotations/${pdf}.json`;

/** Six base-36 characters from the time `now` (ms), the first not in `taken`. */
export function newAnnotationId(
  now: number,
  taken: ReadonlySet<string>,
): string {
  for (let i = Math.floor(now); ; i++) {
    const id = i.toString(36).slice(-6).padStart(6, "0");
    if (!taken.has(id)) return id;
  }
}

const isPoint = (v: unknown): v is PdfPoint =>
  typeof v === "object" &&
  v !== null &&
  typeof (v as PdfPoint).x === "number" &&
  typeof (v as PdfPoint).y === "number";

const point = (p: PdfPoint): PdfPoint => ({ x: p.x, y: p.y });

function itemOf(v: unknown): PdfAnnotation | undefined {
  if (typeof v !== "object" || v === null) return undefined;
  const a = v as Partial<Record<keyof PdfAnnotation, unknown>>;
  if (
    typeof a.id !== "string" ||
    (a.kind !== "highlight" && a.kind !== "note") ||
    typeof a.page !== "number" ||
    !isPoint(a.anchor) ||
    !isPoint(a.head) ||
    typeof a.quote !== "string" ||
    typeof a.created !== "string"
  )
    return undefined;
  return {
    id: a.id,
    kind: a.kind,
    page: a.page,
    anchor: point(a.anchor),
    head: point(a.head),
    ...(a.by === "word" || a.by === "line" ? { by: a.by } : {}),
    quote: a.quote,
    ...(typeof a.note === "string" ? { note: a.note } : {}),
    created: a.created,
    ...(typeof a.updated === "string" ? { updated: a.updated } : {}),
  };
}

/** The items of an annotations file; malformed items are left out. */
export function parseAnnotations(
  text: string,
): { items: PdfAnnotation[] } | { error: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { error: "not valid JSON" };
  }
  const d = data as { version?: unknown; items?: unknown };
  if (typeof data !== "object" || data === null || d.version !== VERSION)
    return { error: `unknown version ${String(d?.version)}` };
  const items = Array.isArray(d.items) ? d.items : [];
  return {
    items: items.flatMap((v) => {
      const a = itemOf(v);
      return a === undefined ? [] : [a];
    }),
  };
}

const byPlace = (a: PdfAnnotation, b: PdfAnnotation) =>
  a.page - b.page ||
  a.created.localeCompare(b.created) ||
  a.id.localeCompare(b.id);

/**
 * The annotations file for `file`: items by page, then age, each with its
 * keys in one order, so a search or a diff reads the same every time.
 */
export function serializeAnnotations(
  file: string,
  items: readonly PdfAnnotation[],
): string {
  const ordered = [...items].sort(byPlace).map((a) => itemOf(a));
  return `${JSON.stringify({ version: VERSION, file, items: ordered }, null, 2)}\n`;
}

/** The words annotation `a` covers on its page's layout. */
export const annotationWords = (
  layout: PdfPageLayout,
  a: PdfAnnotation,
): PdfWord[][] => selectedWords(layout, a);

/** The annotation on page `page` whose words lie under `p`; the newest wins. */
export function annotationAt(
  layout: PdfPageLayout,
  items: readonly PdfAnnotation[],
  page: number,
  p: PdfPoint,
): PdfAnnotation | undefined {
  const x = p.x * layout.width;
  const y = p.y * layout.height;
  const hits = items.filter(
    (a) =>
      a.page === page &&
      annotationWords(layout, a).some((run) =>
        run.some((w) => x >= w.x0 && x <= w.x1 && y >= w.y0 && y <= w.y1),
      ),
  );
  return hits.sort(byPlace).at(-1);
}

const squash = (t: string) => t.replace(/\s+/g, " ").trim();

/**
 * Annotation `a` checked against its page's layout: `same` while it still
 * covers its quote; else moved to where the quote is now on the page; else
 * `detached`.
 */
export function rematch(
  layout: PdfPageLayout,
  a: PdfAnnotation,
): PdfAnnotation | "same" | "detached" {
  const quote = squash(a.quote);
  if (quote === "") return "detached";
  if (squash(selectionText(annotationWords(layout, a))) === quote)
    return "same";
  // The page's words joined by single spaces, each character mapped back to its word.
  const words = layout.lines.flat();
  const owner: { word: number; char: number }[] = [];
  let text = "";
  words.forEach((w, i) => {
    if (i > 0) {
      owner.push({ word: i, char: -1 });
      text += " ";
    }
    [...w.text].forEach((ch, c) => {
      owner.push({ word: i, char: c });
      text += ch;
    });
  });
  const chars = [...text];
  const at = indexOfChars(chars, [...quote]);
  if (at < 0) return "detached";
  const first = owner[at];
  const last = owner[at + [...quote].length - 1];
  const w0 = first === undefined ? undefined : words[first.word];
  const w1 = last === undefined ? undefined : words[last.word];
  if (first === undefined || last === undefined || !w0 || !w1)
    return "detached";
  const edge = (w: PdfWord, c: number) => charEdges(w)[c] ?? w.x0;
  const mid = (w: PdfWord) => (w.y0 + w.y1) / 2;
  const { by: _, ...rest } = a;
  const moved: PdfAnnotation = {
    ...rest,
    anchor: {
      x: edge(w0, Math.max(0, first.char)) / layout.width,
      y: mid(w0) / layout.height,
    },
    head: {
      x: edge(w1, last.char + 1) / layout.width,
      y: mid(w1) / layout.height,
    },
  };
  return squash(selectionText(annotationWords(layout, moved))) === quote
    ? moved
    : "detached";
}

function indexOfChars(hay: readonly string[], needle: readonly string[]) {
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++)
      if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}
