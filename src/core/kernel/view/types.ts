import type { Pos, Range } from "../text/pos";
import type { TextBuffer } from "../text/text-buffer";

/** A theme token name ("codeKeyword", "searchMatch", …), never a colour. Unstyled text is "text". */
export type StyleToken = string;

export type Span = {
  text: string;
  style: StyleToken;
  link?: string;
  /** Source column of the first character. */
  col?: number;
  /** Replacement text: every cell maps to `col`. */
  inserted?: true;
  /** A click on this text flips the fold of this block id in its window. */
  fold?: number;
  /** The tag this text shows, for a click on text drawn in place of its source. */
  tag?: string;
  /**
   * Text that is not in the buffer and hides nothing: `inline` sits before
   * the character at `col`; `eol` follows the line and is cut at the window
   * edge instead of wrapping.
   */
  virtual?: "inline" | "eol";
};

export type Sign = { text: string; style: StyleToken };

/** Source lines `from` up to, not including, `to`. */
export type LineRange = { from: number; to: number };

/** Rows painted by a UI widget painter registered for `type`. */
export type Widget = { type: string; data: unknown; rows: number };

/** One window's view of a buffer; `visible` is the source lines on screen. */
export type TextView = {
  buf: TextBuffer;
  width: number;
  topRow: number;
  rows: number;
  cursor: Pos;
  selection?: Range;
  folds: ReadonlySet<number>;
  visible: LineRange;
};

/**
 * One screen row. Text outside `replace` decorations is copied verbatim, so
 * a span's offset in the row is its source column.
 */
export type RenderLine = {
  sourceLine: number;
  spans: Span[];
  widget?: Widget;
  sign?: Sign;
};

/** Syntax highlighting for a line range: one span list per line. */
export interface Highlighter {
  language: string;
  highlight(buf: TextBuffer, lines: LineRange): Span[][];
}
