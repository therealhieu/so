import type { Edit, Pos } from "../text/pos";

/**
 * One undo step: the edits of one Normal-mode command or one Insert session.
 * `inverses[i]` undoes `edits[i]`; undo applies them in reverse order.
 */
export type UndoBlock = {
  edits: readonly Edit[];
  inverses: readonly Edit[];
  cursorBefore: Pos;
};

/** Immutable undo/redo stacks of blocks. */
export class UndoHistory {
  constructor(
    readonly done: readonly UndoBlock[] = [],
    readonly undone: readonly UndoBlock[] = [],
  ) {}

  /** Record a new block; a new change discards the redo stack. */
  push(block: UndoBlock): UndoHistory {
    return new UndoHistory([...this.done, block], []);
  }

  /** The edits that undo the newest block, in application order. */
  undo():
    | { history: UndoHistory; edits: Edit[]; block: UndoBlock }
    | undefined {
    const block = this.done.at(-1);
    if (block === undefined) return undefined;
    return {
      history: new UndoHistory(this.done.slice(0, -1), [...this.undone, block]),
      edits: [...block.inverses].reverse(),
      block,
    };
  }

  /** The edits that redo the newest undone block, in application order. */
  redo():
    | { history: UndoHistory; edits: Edit[]; block: UndoBlock }
    | undefined {
    const block = this.undone.at(-1);
    if (block === undefined) return undefined;
    return {
      history: new UndoHistory([...this.done, block], this.undone.slice(0, -1)),
      edits: [...block.edits],
      block,
    };
  }
}
