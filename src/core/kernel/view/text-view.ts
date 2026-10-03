import type { Decoration, DecorationProvider } from "./decorations";
import type {
  RenderLine,
  Sign,
  Span,
  StyleToken,
  TextView,
  Widget,
} from "./types";

const PLAIN: StyleToken = "text";

/**
 * Lay out the visible lines with every provider's decorations. Later
 * providers win where marks overlap. A block widget goes above its line when
 * it sits at column 0 and below it otherwise. A block `replace` hides every
 * visible line it covers and shows its row once, at its first visible line.
 */
export function layoutText(
  v: TextView,
  providers: readonly DecorationProvider[],
  analysis: unknown,
): RenderLine[] {
  const decos = providers.flatMap((p) => p(v, analysis));
  const out: RenderLine[] = [];
  let rows = 0;
  const emit = (row: RenderLine) => {
    if (rows >= v.rows) return;
    out.push(row);
    rows +=
      row.widget !== undefined && row.spans.length === 0
        ? Math.max(1, row.widget.rows)
        : 1;
  };
  const last = Math.min(v.visible.to, v.buf.lineCount);
  for (let line = v.visible.from; line < last && rows < v.rows; line++) {
    if (v.folds.has(line)) continue;
    const block = decos.find(
      (d) =>
        d.kind === "replace" &&
        d.block &&
        d.range.start.line <= line &&
        d.range.end.line >= line,
    );
    if (block?.kind === "replace") {
      if (block.spans !== undefined || block.widget !== undefined)
        emit(
          withWidget(
            { sourceLine: line, spans: block.spans ?? [] },
            block.widget,
          ),
        );
      line = block.range.end.line;
      continue;
    }
    const widgets = decos.filter(
      (d): d is Extract<Decoration, { kind: "widget" }> =>
        d.kind === "widget" && d.block && d.at.line === line,
    );
    for (const w of widgets)
      if (w.at.col === 0)
        emit({ sourceLine: line, spans: [], widget: w.widget });
    emit(layoutLine(v, line, decos));
    for (const w of widgets)
      if (w.at.col > 0) emit({ sourceLine: line, spans: [], widget: w.widget });
  }
  return out;
}

const withWidget = (row: RenderLine, widget: Widget | undefined): RenderLine =>
  widget === undefined ? row : { ...row, widget };

/** The part of `range` on `line` as [start, end) columns, or undefined. */
function onLine(
  range: {
    start: { line: number; col: number };
    end: { line: number; col: number };
  },
  line: number,
  length: number,
): [number, number] | undefined {
  if (range.start.line > line || range.end.line < line) return undefined;
  const start = range.start.line < line ? 0 : range.start.col;
  const end = range.end.line > line ? length : range.end.col;
  return [Math.min(start, length), Math.min(end, length)];
}

function layoutLine(
  v: TextView,
  line: number,
  decos: readonly Decoration[],
): RenderLine {
  const text = v.buf.line(line);
  let base = PLAIN;
  let sign: Sign | undefined;
  let widget: Widget | undefined;
  for (const d of decos)
    if (d.kind === "line" && d.line === line) {
      if (d.style !== undefined) base = d.style;
      if (d.sign !== undefined) sign = d.sign;
    } else if (d.kind === "widget" && !d.block && d.at.line === line)
      widget = d.widget;
  const styles: StyleToken[] = Array.from({ length: text.length }, () => base);
  const hidden: boolean[] = [];
  const inserts = new Map<number, Span[]>();
  for (const d of decos) {
    if (d.kind === "mark") {
      const cols = onLine(d.range, line, text.length);
      if (cols !== undefined) styles.fill(d.style, cols[0], cols[1]);
    } else if (d.kind === "replace" && !d.block) {
      const cols = onLine(d.range, line, text.length);
      if (cols === undefined) continue;
      for (let c = cols[0]; c < cols[1]; c++) hidden[c] = true;
      // Replacement content shows once, on the range's first line.
      if (d.range.start.line !== line) continue;
      if (d.spans !== undefined)
        inserts.set(cols[0], [...(inserts.get(cols[0]) ?? []), ...d.spans]);
      if (d.widget !== undefined) widget = d.widget;
    }
  }
  const spans = spansOf(text, styles, hidden, inserts);
  const row: RenderLine = withWidget({ sourceLine: line, spans }, widget);
  return sign === undefined ? row : { ...row, sign };
}

function spansOf(
  text: string,
  styles: readonly StyleToken[],
  hidden: readonly boolean[],
  inserts: ReadonlyMap<number, Span[]>,
): Span[] {
  const spans: Span[] = [];
  let run: Span | undefined;
  const flush = () => {
    if (run !== undefined) spans.push(run);
    run = undefined;
  };
  for (let c = 0; c <= text.length; c++) {
    const inserted = inserts.get(c);
    if (inserted !== undefined) {
      flush();
      spans.push(...inserted);
    }
    if (c === text.length) break;
    if (hidden[c]) {
      flush();
      continue;
    }
    const style = styles[c] ?? PLAIN;
    if (run?.style !== style) {
      flush();
      run = { text: "", style };
    }
    run.text += text[c];
  }
  flush();
  return spans;
}
