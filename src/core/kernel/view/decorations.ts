import type { Pos, Range } from "../text/pos";
import type { Sign, Span, StyleToken, TextView, Widget } from "./types";

/**
 * How language code changes what a line looks like, never its text:
 * `mark` styles a range; `replace` hides a range (inline, or whole lines when
 * `block`) and shows `spans` or a `widget` instead; `widget` inserts rows
 * (`block`) or inline content; `line` styles a line, gives it a sign or a
 * change sign, gives its wrap rows after the first a prefix, or stretches
 * its wrapped rows to the width (`justify`).
 */
export type Decoration =
  | { kind: "mark"; range: Range; style: StyleToken }
  | {
      kind: "replace";
      range: Range;
      block: boolean;
      spans?: Span[];
      widget?: Widget;
    }
  | { kind: "widget"; at: Pos; block: boolean; widget: Widget }
  | {
      kind: "line";
      line: number;
      style?: StyleToken;
      sign?: Sign;
      changeSign?: Sign;
      wrapPrefix?: Span[];
      /** Spread the line's wrapped rows to both edges. */
      justify?: true;
    };

/** A pure function of the view; it reads only `v.visible` lines. */
export type DecorationProvider<S = unknown> = (
  v: TextView,
  analysis: S,
) => Decoration[];
