/**
 * One key in Vim notation: a printable character ("a", " ", "<") or a named
 * key ("<Esc>", "<CR>", "<BS>", "<Tab>", "<C-r>", "<C-w>").
 */
export type Key = string;

const NAMED: Record<string, Key> = {
  "<lt>": "<",
  "<space>": " ",
  "<leader>": " ",
  "<esc>": "<Esc>",
  "<cr>": "<CR>",
  "<enter>": "<CR>",
  "<bs>": "<BS>",
  "<tab>": "<Tab>",
};

/** Split a key sequence in Vim notation ("<leader>e", "ciwx<Esc>") into keys. */
export function splitKeys(seq: string): Key[] {
  const keys: Key[] = [];
  for (let i = 0; i < seq.length; ) {
    const close = seq[i] === "<" ? seq.indexOf(">", i) : -1;
    const name = close > i + 1 ? seq.slice(i, close + 1) : undefined;
    const ctrl = name?.match(/^<C-(.)>$/i);
    if (name !== undefined && (NAMED[name.toLowerCase()] ?? ctrl)) {
      keys.push(NAMED[name.toLowerCase()] ?? `<C-${ctrl?.[1]?.toLowerCase()}>`);
      i = close + 1;
    } else {
      keys.push(seq[i] as string);
      i++;
    }
  }
  return keys;
}
