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
  /** The line's style; text without a background of its own takes this one's. */
  under?: StyleToken;
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

/** A run of one look drawn at its block's scale, `cells` columns wide. */
export type SizedChunk = {
  text: string;
  style: StyleToken;
  under?: StyleToken;
  cells: number;
};

/**
 * Text the terminal draws larger than one cell (kitty's text sizing
 * protocol); each row of chunks takes two screen rows.
 */
export type SizedBlock = { scale: 2 | 1.5; rows: SizedChunk[][] };

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
  /** The sign in the change column, left of the line number. */
  changeSign?: Sign;
  /** Drawn at the start of each wrap row after the first, before the text. */
  wrapPrefix?: Span[];
  /** Each wrap row but the last is stretched to the width; see `justifyRow`. */
  justify?: true;
};

/** Syntax highlighting for a line range: one span list per line. */
export interface Highlighter {
  language: string;
  highlight(buf: TextBuffer, lines: LineRange): Span[][];
}
