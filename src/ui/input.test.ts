import { expect, test } from "bun:test";
import { createKeyNormalizer, type KeyInput, toKey } from "./input";

/** A fake clock whose timers fire only when `advance` passes their due time. */
function fakeTime() {
  let t = 0;
  let timers: { due: number; fn: () => void; id: number }[] = [];
  let next = 1;
  return {
    now: () => t,
    setTimer: (fn: () => void, ms: number) => {
      const id = next++;
      timers.push({ due: t + ms, fn, id });
      return id;
    },
    clear: (id: number) => {
      timers = timers.filter((x) => x.id !== id);
    },
    advance(ms: number) {
      const until = t + ms;
      for (;;) {
        const due = timers
          .filter((x) => x.due <= until)
          .sort((a, b) => a.due - b.due)[0];
        if (due === undefined) break;
        timers = timers.filter((x) => x !== due);
        t = due.due;
        due.fn();
      }
      t = until;
    },
  };
}

const key = (name: string, o: Partial<KeyInput> = {}): KeyInput => ({
  name,
  ctrl: false,
  meta: false,
  shift: false,
  sequence: name.length === 1 ? name : "",
  source: "raw",
  ...o,
});
const ESC = key("escape", { sequence: "\x1b" });

function setup(escTimeoutMs: number | (() => number)) {
  const time = fakeTime();
  const out: [string, number][] = [];
  const n = createKeyNormalizer({
    escTimeoutMs,
    now: time.now,
    setTimer: time.setTimer,
    clear: time.clear,
    emit: (k, at) => out.push([k, at]),
  });
  return { time, out, n };
}

test("a raw Esc is held until the configured timeout, counting OpenTUI's 20 ms", () => {
  const { time, out, n } = setup(50);
  time.advance(20); // OpenTUI reports a lone legacy Esc 20 ms after the byte
  n.feed(ESC);
  expect(out).toEqual([]);
  time.advance(29);
  expect(out).toEqual([]);
  time.advance(1);
  expect(out).toEqual([["<Esc>", 50]]);
});

test("a timeout given as a function is read at each Esc", () => {
  let timeout = 50;
  const { time, out, n } = setup(() => timeout);
  n.feed(ESC);
  time.advance(30);
  expect(out).toEqual([["<Esc>", 30]]);
  timeout = 200;
  n.feed(ESC);
  time.advance(179);
  expect(out).toHaveLength(1);
  time.advance(1);
  expect(out).toEqual([
    ["<Esc>", 30],
    ["<Esc>", 210],
  ]);
});

test("a timeout at or below 20 ms and a kitty Esc pass at once", () => {
  const short = setup(10);
  short.time.advance(20);
  short.n.feed(ESC);
  expect(short.out).toEqual([["<Esc>", 20]]);
  const kitty = setup(50);
  kitty.n.feed(key("escape", { sequence: "\x1b[27u", source: "kitty" }));
  expect(kitty.out).toEqual([["<Esc>", 0]]);
});

test("a key during the hold releases the Esc first", () => {
  const { time, out, n } = setup(50);
  n.feed(ESC);
  time.advance(5);
  n.feed(key("j"));
  expect(out.map(([k]) => k)).toEqual(["<Esc>", "j"]);
  time.advance(100);
  expect(out).toHaveLength(2);
});

test("a legacy meta+key is split into Esc and the key", () => {
  const { out, n } = setup(50);
  n.feed(key("j", { meta: true, sequence: "\x1bj" }));
  expect(out.map(([k]) => k)).toEqual(["<Esc>", "j"]);
});

test("escape sequences such as arrows resolve immediately", () => {
  const { out, n } = setup(50);
  n.feed(key("up", { sequence: "\x1b[A" }));
  expect(out).toEqual([["<Up>", 0]]);
});

test("key events map to Vim key notation", () => {
  expect(toKey(key("return", { sequence: "\r" }))).toBe("<CR>");
  expect(toKey(key("tab", { sequence: "\t" }))).toBe("<Tab>");
  expect(toKey(key("backspace", { sequence: "\b" }))).toBe("<BS>");
  expect(toKey(key("space", { sequence: " " }))).toBe(" ");
  expect(toKey(key("c", { ctrl: true, sequence: "\x03" }))).toBe("<C-c>");
  expect(toKey(key("h", { shift: true, sequence: "H" }))).toBe("H");
  expect(toKey(key("A", { sequence: "A", source: "kitty" }))).toBe("A");
  expect(toKey(key("é", { sequence: "é", source: "kitty" }))).toBe("é");
  expect(toKey(key("f5", { sequence: "\x1b[15~" }))).toBeUndefined();
});

test("ctrl+space is its own key and space stays a space", () => {
  expect(
    toKey(key("space", { ctrl: true, sequence: " ", source: "kitty" })),
  ).toBe("<C-Space>");
  expect(toKey(key("space", { ctrl: true, sequence: "\x00" }))).toBe(
    "<C-Space>",
  );
  expect(toKey(key("space", { sequence: " " }))).toBe(" ");
});
