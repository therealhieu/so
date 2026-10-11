/** A one-line text field: its text and the caret's offset in it. */
export type LineField = { value: string; caret: number };

/** A prompt's field; a prompt without a caret has it at the end. */
export const promptField = (p: {
  value: string;
  caret?: number;
}): LineField => ({
  value: p.value,
  caret: Math.min(p.caret ?? p.value.length, p.value.length),
});

/** The offset one character before `caret`, or after it. */
const before = (value: string, caret: number) =>
  caret - ([...value.slice(0, caret)].at(-1)?.length ?? 0);
const after = (value: string, caret: number) =>
  caret + ([...value.slice(caret)][0]?.length ?? 0);

/**
 * `key` applied to a field: a printable key is inserted at the caret,
 * `<BS>` and `<Del>` delete the character before or after it, `<Left>` and
 * `<Right>` move it one character, `<Home>` and `<End>` to either end.
 * `undefined` for any other key.
 */
export function editField(f: LineField, key: string): LineField | undefined {
  const { value, caret } = f;
  switch (key) {
    case "<BS>": {
      const at = before(value, caret);
      return { value: value.slice(0, at) + value.slice(caret), caret: at };
    }
    case "<Del>":
      return {
        value: value.slice(0, caret) + value.slice(after(value, caret)),
        caret,
      };
    case "<Left>":
      return { value, caret: before(value, caret) };
    case "<Right>":
      return { value, caret: after(value, caret) };
    case "<Home>":
      return { value, caret: 0 };
    case "<End>":
      return { value, caret: value.length };
    default:
      return [...key].length === 1
        ? {
            value: value.slice(0, caret) + key + value.slice(caret),
            caret: caret + key.length,
          }
        : undefined;
  }
}
