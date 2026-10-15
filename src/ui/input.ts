import type { KeyEvent } from "@opentui/core";
import type { RawKey } from "../core/features/browser/keys";
import type { Key } from "../core/kernel/vim/keys";

/** OpenTUI's stdin parser reports a lone legacy Esc after this fixed delay. */
export const OPENTUI_ESC_MS = 20;

/** The parts of an OpenTUI key event the normalizer reads. */
export type KeyInput = Pick<
  KeyEvent,
  "name" | "ctrl" | "meta" | "shift" | "sequence" | "source"
> &
  Partial<Pick<KeyEvent, "option" | "super">>;

const NAMES: Readonly<Record<string, Key>> = {
  return: "<CR>",
  enter: "<CR>",
  linefeed: "<CR>",
  escape: "<Esc>",
  tab: "<Tab>",
  backspace: "<BS>",
  space: " ",
  up: "<Up>",
  down: "<Down>",
  left: "<Left>",
  right: "<Right>",
  delete: "<Del>",
  home: "<Home>",
  end: "<End>",
  pageup: "<PageUp>",
  pagedown: "<PageDown>",
};

const ESC = String.fromCharCode(0x1b);

/** One printable character, or undefined. */
function printable(s: string): string | undefined {
  const cp = s.codePointAt(0) ?? 0;
  return [...s].length === 1 && cp >= 0x20 && cp !== 0x7f ? s : undefined;
}

/** An OpenTUI key event in Vim notation; undefined for keys the editor has no name for. */
export function toKey(e: KeyInput): Key | undefined {
  if (e.ctrl && /^[a-z]$/.test(e.name)) return `<C-${e.name}>`;
  // Ctrl-\ arrives as "\" with modified keys and as FS (0x1c) from a legacy terminal.
  if ((e.ctrl && e.name === "\\") || e.sequence === "\x1c") return "<C-\\>";
  if (e.ctrl && e.name === "space") return "<C-Space>";
  // Ctrl-^ arrives as "^" from a legacy terminal and as "6" with modified keys.
  if (e.ctrl && (e.name === "^" || e.name === "6")) return "<C-^>";
  const named = NAMES[e.name];
  if (named !== undefined) return named;
  const seq =
    e.meta && e.sequence.startsWith(ESC) ? e.sequence.slice(1) : e.sequence;
  return printable(seq) ?? printable(e.name);
}

/** The key as the terminal reported it, for a page that wants it whole. */
export function rawKey(e: KeyInput): RawKey {
  const alt = e.meta || e.option === true;
  const meta = e.super === true;
  const seq =
    e.meta && e.sequence.startsWith(ESC) ? e.sequence.slice(1) : e.sequence;
  const text = e.ctrl || meta ? undefined : printable(seq);
  const raw = { name: e.name, ctrl: e.ctrl, alt, shift: e.shift, meta };
  return text === undefined ? raw : { ...raw, text };
}

const ESC_RAW: RawKey = {
  name: "escape",
  ctrl: false,
  alt: false,
  shift: false,
  meta: false,
};

export type KeyNormalizer = { feed(e: KeyInput): void };

/**
 * Turns OpenTUI key events into editor keys. A raw (legacy) Esc is held for
 * `escTimeoutMs − 20` ms more, so the effective timeout is
 * `max(escTimeoutMs, 20)`; a key during the hold releases the Esc first.
 * A function `escTimeoutMs` is read at each Esc, so a reloaded config applies.
 * Kitty Esc and escape sequences pass at once. Legacy `meta+key` is an Esc
 * typed just before the key, so it is split back into both.
 */
export function createKeyNormalizer<T>(o: {
  escTimeoutMs: number | (() => number);
  now: () => number;
  setTimer: (fn: () => void, ms: number) => T;
  clear: (timer: T) => void;
  emit: (key: Key, now: number, raw?: RawKey) => void;
  /** A key with no name in Vim notation (such as an F-key), as reported. */
  unnamed?: (raw: RawKey, now: number) => void;
}): KeyNormalizer {
  let held: T | undefined;
  const release = () => {
    if (held === undefined) return;
    o.clear(held);
    held = undefined;
    o.emit("<Esc>", o.now(), ESC_RAW);
  };
  return {
    feed(e) {
      const key = toKey(e);
      if (key === "<Esc>" && e.source === "raw") {
        release();
        const timeout =
          typeof o.escTimeoutMs === "number"
            ? o.escTimeoutMs
            : o.escTimeoutMs();
        const extra = Math.max(0, timeout - OPENTUI_ESC_MS);
        if (extra === 0) return o.emit(key, o.now(), ESC_RAW);
        held = o.setTimer(() => {
          held = undefined;
          o.emit("<Esc>", o.now(), ESC_RAW);
        }, extra);
        return;
      }
      release();
      if (key === undefined) {
        if (e.name !== "") o.unnamed?.(rawKey(e), o.now());
        return;
      }
      if (e.meta && e.source === "raw" && key !== "<Esc>") {
        o.emit("<Esc>", o.now(), ESC_RAW);
        return o.emit(key, o.now(), { ...rawKey(e), alt: false });
      }
      o.emit(key, o.now(), rawKey(e));
    },
  };
}
