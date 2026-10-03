/** Zero-based position; `col` counts UTF-16 code units. */
export type Pos = { line: number; col: number };

/** Half-open range: `start` is included, `end` is excluded. */
export type Range = { start: Pos; end: Pos };

/** Replace `range` with `text`; `text` may contain "\n". */
export type Edit = { range: Range; text: string };
