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
  /**
   * One or two narrow characters drawn half size in this span's one cell,
   * raised or lowered; `text` is the first of them, shown where the
   * terminal cannot size text.
   */
  script?: { text: string; place: "sup" | "sub" };
};

export type Sign = { text: string; style: StyleToken };

/** Source lines `from` up to, not including, `to`. */
export type LineRange = { from: number; to: number };

/**
 * A run of one look drawn at its block's scale, `cells` columns wide; a
 * `plain` chunk is a space left blank at normal size.
 */
export type SizedChunk = {
  text: string;
  style: StyleToken;
  under?: StyleToken;
  cells: number;
  plain?: true;
  /** Display column of the first cell it draws; absent on a wrap prefix. */
  col?: number;
  /** Normal-size cells it draws, from `col`. */
  w?: number;
  /**
   * Where a chunk drawn below its sized cells' size sits in them; absent,
   * at their left.
   */
  align?: "right" | "center";
  /**
   * A shape like a quote bar, drawn at normal size on every row of its
   * sized cells instead of by the terminal, so it runs unbroken.
   */
  bar?: true;
  /** A bar's text on the rows after its first; absent, its text again. */
  down?: string;
};

/**
 * Text size as `n/d` of `s` times the normal size (`s` defaults to 2): 7/8
 * draws text at 1.75×, and each row takes `s` screen rows. With
 * `wordSpace`, each word starts its own chunks, a word's chunks meet, and a
 * space between words is that many blank normal-size cells, so the gap kitty
 * leaves after a chunk falls between words. With `words`, each word is placed on its own and
 * every space between words takes its width at the scale.
 */
export type SizedScale = {
  s?: number;
  n: number;
  d: number;
  wordSpace?: number;
  words?: true;
  /** Columns one character's text takes, where it is not `s × n / d`. */
  adv?: number;
};

/**
 * Text the terminal draws larger than one cell (kitty's text sizing
 * protocol); each row of chunks takes `scale.s` screen rows.
 */
export type SizedBlock = { scale: SizedScale; rows: SizedChunk[][] };

/**
 * One row of a zoomed line: the display columns [startCol, endCol) it
 * shows, as sized chunks after the wrap prefix's; the last row has no
 * `endCol`.
 */
export type ZoomRow = {
  startCol: number;
  endCol?: number;
  chunks: SizedChunk[];
};

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
  /** Drawn larger by the terminal, at the view's zoom; see `zoomRows`. */
  zoom?: true;
};

/** Syntax highlighting for a line range: one span list per line. */
export interface Highlighter {
  language: string;
  highlight(buf: TextBuffer, lines: LineRange): Span[][];
}
