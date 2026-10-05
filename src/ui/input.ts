import type { KeyEvent } from "@opentui/core";
import type { Key } from "../core/kernel/vim/keys";

/** OpenTUI's stdin parser reports a lone legacy Esc after this fixed delay. */
export const OPENTUI_ESC_MS = 20;

/** The parts of an OpenTUI key event the normalizer reads. */
export type KeyInput = Pick<
  KeyEvent,
  "name" | "ctrl" | "meta" | "shift" | "sequence" | "source"
>;

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
  if (e.ctrl && e.name === "space") return "<C-Space>";
  const named = NAMES[e.name];
  if (named !== undefined) return named;
  const seq =
    e.meta && e.sequence.startsWith(ESC) ? e.sequence.slice(1) : e.sequence;
  return printable(seq) ?? printable(e.name);
}

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
  emit: (key: Key, now: number) => void;
}): KeyNormalizer {
  let held: T | undefined;
  const release = () => {
    if (held === undefined) return;
    o.clear(held);
    held = undefined;
    o.emit("<Esc>", o.now());
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
        if (extra === 0) return o.emit(key, o.now());
        held = o.setTimer(() => {
          held = undefined;
          o.emit("<Esc>", o.now());
        }, extra);
        return;
      }
      release();
      if (key === undefined) return;
      if (e.meta && e.source === "raw" && key !== "<Esc>") {
        o.emit("<Esc>", o.now());
        return o.emit(key, o.now());
      }
      o.emit(key, o.now());
    },
  };
}
