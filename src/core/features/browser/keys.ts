/**
 * A key as the terminal reported it, before Vim notation: what a page needs
 * to see the same key a desktop browser would. `name` is the terminal
 * parser's key name ("a", "return", "up", "f5"); `text` is what the key types.
 */
export type RawKey = {
  name: string;
  text?: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
};

/** The DevTools `Input.dispatchKeyEvent` fields for one key. */
export type PageKey = {
  key: string;
  code: string;
  keyCode: number;
  text?: string;
  /** Alt 1, Ctrl 2, Meta 4, Shift 8. */
  modifiers: number;
};

const NAMED: Readonly<Record<string, [key: string, code: string, vk: number]>> =
  {
    return: ["Enter", "Enter", 13],
    enter: ["Enter", "Enter", 13],
    linefeed: ["Enter", "Enter", 13],
    tab: ["Tab", "Tab", 9],
    backspace: ["Backspace", "Backspace", 8],
    escape: ["Escape", "Escape", 27],
    space: [" ", "Space", 32],
    delete: ["Delete", "Delete", 46],
    insert: ["Insert", "Insert", 45],
    home: ["Home", "Home", 36],
    end: ["End", "End", 35],
    pageup: ["PageUp", "PageUp", 33],
    pagedown: ["PageDown", "PageDown", 34],
    up: ["ArrowUp", "ArrowUp", 38],
    down: ["ArrowDown", "ArrowDown", 40],
    left: ["ArrowLeft", "ArrowLeft", 37],
    right: ["ArrowRight", "ArrowRight", 39],
  };

/** US-layout punctuation: the key's code and Windows virtual key code. */
const PUNCTUATION: Readonly<Record<string, [code: string, vk: number]>> = {
  ";": ["Semicolon", 186],
  ":": ["Semicolon", 186],
  "=": ["Equal", 187],
  "+": ["Equal", 187],
  ",": ["Comma", 188],
  "<": ["Comma", 188],
  "-": ["Minus", 189],
  _: ["Minus", 189],
  ".": ["Period", 190],
  ">": ["Period", 190],
  "/": ["Slash", 191],
  "?": ["Slash", 191],
  "`": ["Backquote", 192],
  "~": ["Backquote", 192],
  "[": ["BracketLeft", 219],
  "{": ["BracketLeft", 219],
  "\\": ["Backslash", 220],
  "|": ["Backslash", 220],
  "]": ["BracketRight", 221],
  "}": ["BracketRight", 221],
  "'": ["Quote", 222],
  '"': ["Quote", 222],
};

const SHIFTED_DIGITS = ")!@#$%^&*(";

/** The page-side fields for a raw key; undefined for a key a page cannot get. */
export function pageKey(k: RawKey): PageKey | undefined {
  const modifiers =
    (k.alt ? 1 : 0) | (k.ctrl ? 2 : 0) | (k.meta ? 4 : 0) | (k.shift ? 8 : 0);
  // A typed character only when no command modifier is held.
  const typed = !k.ctrl && !k.meta;
  const named = NAMED[k.name];
  if (named !== undefined) {
    const [key, code, keyCode] = named;
    const text =
      !typed || k.alt
        ? undefined
        : key === "Enter"
          ? "\r"
          : key === " "
            ? " "
            : undefined;
    return text === undefined
      ? { key, code, keyCode, modifiers }
      : { key, code, keyCode, text, modifiers };
  }
  const fn = /^f([1-9]|1[0-2])$/.exec(k.name);
  if (fn !== null) {
    const n = Number(fn[1]);
    return { key: `F${n}`, code: `F${n}`, keyCode: 111 + n, modifiers };
  }
  const ch = k.text ?? (k.name.length === 1 ? k.name : undefined);
  if (ch === undefined || [...ch].length !== 1) return undefined;
  const key = k.shift && /^[a-z]$/.test(ch) ? ch.toUpperCase() : ch;
  const lower = key.toLowerCase();
  let code = "";
  let keyCode = 0;
  if (/^[a-z]$/.test(lower)) {
    code = `Key${lower.toUpperCase()}`;
    keyCode = lower.toUpperCase().charCodeAt(0);
  } else if (/^[0-9]$/.test(key)) {
    code = `Digit${key}`;
    keyCode = 48 + Number(key);
  } else if (SHIFTED_DIGITS.includes(key)) {
    const d = SHIFTED_DIGITS.indexOf(key);
    code = `Digit${d}`;
    keyCode = 48 + d;
  } else {
    const p = PUNCTUATION[key];
    if (p !== undefined) [code, keyCode] = p;
  }
  return typed
    ? { key, code, keyCode, text: key, modifiers }
    : { key, code, keyCode, modifiers };
}

const VIM_NAMES: Readonly<Record<string, string>> = {
  "<CR>": "return",
  "<Esc>": "escape",
  "<Tab>": "tab",
  "<BS>": "backspace",
  "<Up>": "up",
  "<Down>": "down",
  "<Left>": "left",
  "<Right>": "right",
  "<Del>": "delete",
  "<Home>": "home",
  "<End>": "end",
  "<PageUp>": "pageup",
  "<PageDown>": "pagedown",
};

/**
 * The raw key behind a key in Vim notation, for keys that arrive without
 * the terminal's report (replays and tests); undefined when it names none.
 */
export function rawKeyOf(key: string): RawKey | undefined {
  const plain = { ctrl: false, alt: false, shift: false, meta: false };
  const named = VIM_NAMES[key];
  if (named !== undefined) return { name: named, ...plain };
  if (key === " ") return { name: "space", text: " ", ...plain };
  const ctrl = /^<C-(.)>$/.exec(key);
  if (ctrl !== null) return { name: ctrl[1] as string, ...plain, ctrl: true };
  if ([...key].length !== 1) return undefined;
  const shift = key !== key.toLowerCase();
  return { name: key.toLowerCase(), text: key, ...plain, shift };
}
