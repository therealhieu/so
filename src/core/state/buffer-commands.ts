import type { Binding } from "../kernel/commands/defaults";
import type { Command } from "../kernel/commands/registry";
import {
  activeBuffer,
  listedBuffers,
  orderedBuffers,
  recentBuffers,
  showBuffer,
} from "./buffers";
import type { CommandContext, CommandResult } from "./commands";
import { openPicker } from "./picker";
import { chain, message, none } from "./result";
import { autosaveNow, blocked, closeBuffer, writeAll } from "./save";
import type { AppState, BufferId, BufferState, Result } from "./types";

type AppCommand = Command<CommandContext, CommandResult>;

/** Show buffer `id` in the active window, saving the buffer it leaves. */
export function goToBuffer(s: AppState, id: BufferId, now: number): Result {
  const current = activeBuffer(s);
  if (s.buffers[id] === undefined || current?.id === id) return none(s);
  const left =
    current === undefined ? none(s) : autosaveNow(s, current.id, now);
  return chain(left, (st) => none(showBuffer(st, id)));
}

/** `:bn` / `:bp`: the next or previous buffer in bufferline order. */
function cycle(c: CommandContext, delta: 1 | -1): Result {
  const ids = orderedBuffers(c.state).map((b) => b.id);
  const current = activeBuffer(c.state);
  if (current === undefined || ids.length < 2) return none(c.state);
  const at = ids.indexOf(current.id);
  const next = ids[(at + delta + ids.length) % ids.length];
  return next === undefined ? none(c.state) : goToBuffer(c.state, next, c.now);
}

/** `<C-^>` / `:b#`: the buffer shown before the current one. */
function alternate(c: CommandContext): Result {
  const current = activeBuffer(c.state)?.id;
  const alt = recentBuffers(c.state).find((b) => b.id !== current);
  return alt === undefined
    ? message(c.state, "E23: No alternate file", "error")
    : goToBuffer(c.state, alt.id, c.now);
}

/**
 * `:b N`, `:b name`, `:b#`: a buffer by number, by name (the exact path, else
 * a file-name prefix, a path prefix, then any part of the path, ignoring
 * case; the first kind with a match must match once), or the alternate.
 */
function goByArg(c: CommandContext): Result {
  const arg = c.args?.trim() ?? "";
  if (arg === "") return none(c.state);
  if (arg === "#") return alternate(c);
  const listed = listedBuffers(c.state);
  if (/^\d+$/.test(arg)) {
    const b = listed.find((x) => x.id === Number(arg));
    return b === undefined
      ? message(c.state, `E86: Buffer ${arg} does not exist`, "error")
      : goToBuffer(c.state, b.id, c.now);
  }
  const needle = arg.toLowerCase();
  const path = (b: BufferState) => b.path.toLowerCase();
  const name = (b: BufferState) => path(b).slice(path(b).lastIndexOf("/") + 1);
  // As Vim does, a closer kind of match wins over looser ones.
  const tiers = [
    (b: BufferState) => b.path === arg,
    (b: BufferState) => name(b).startsWith(needle),
    (b: BufferState) => path(b).startsWith(needle),
    (b: BufferState) => path(b).includes(needle),
  ];
  const hits =
    tiers.map((t) => listed.filter(t)).find((h) => h.length > 0) ?? [];
  const [hit, ...more] = hits;
  if (hit === undefined)
    return message(c.state, `E94: No matching buffer for ${arg}`, "error");
  if (more.length > 0)
    return message(c.state, `E93: More than one match for ${arg}`, "error");
  return goToBuffer(c.state, hit.id, c.now);
}

/** `:bd` / `:bd!` on the active buffer. */
function closeActive(c: CommandContext, force: boolean): Result {
  const b = activeBuffer(c.state);
  return b === undefined
    ? none(c.state)
    : closeBuffer(c.state, b.id, { force }, c.now);
}

/**
 * Close `targets` the way `:bd` does: unsaved changes are written first.
 * Buffers whose changes cannot be written stay open, and one message says how many.
 */
function closeEach(c: CommandContext, targets: readonly BufferState[]): Result {
  const s = c.state;
  const kept = targets.filter((b) => blocked(s, b));
  const closed = targets
    .filter((b) => !blocked(s, b))
    .reduce(
      (r, b) =>
        chain(r, (st) => closeBuffer(st, b.id, { force: false }, c.now)),
      none(s),
    );
  if (kept.length === 0) return closed;
  const what = kept.length === 1 ? kept[0]?.path : `${kept.length} buffers`;
  return chain(closed, (st) =>
    message(st, `E37: No write since last change (${what} kept open)`, "error"),
  );
}

/** Unpinned buffers the `pick` predicate selects by bufferline index, relative to the active one. */
function closeUnpinnedWhere(
  c: CommandContext,
  pick: (index: number, active: number) => boolean,
): Result {
  const tabs = orderedBuffers(c.state);
  const current = activeBuffer(c.state)?.id;
  const active = tabs.findIndex((b) => b.id === current);
  if (active < 0) return none(c.state);
  return closeEach(
    c,
    tabs.filter((b, i) => b.pinned !== true && pick(i, active)),
  );
}

function togglePin(c: CommandContext): Result {
  const s = c.state;
  const b = activeBuffer(s);
  if (b === undefined || b.listed === false) return none(s);
  const { pinned, ...rest } = b;
  const next: BufferState = pinned === true ? rest : { ...b, pinned: true };
  return message(
    { ...s, buffers: { ...s.buffers, [b.id]: next } },
    pinned === true ? "unpinned" : "pinned",
  );
}

/** Swap the active tab with its neighbour in the same pinned or unpinned group. */
function move(c: CommandContext, delta: 1 | -1): Result {
  const s = c.state;
  const tabs = orderedBuffers(s);
  const at = tabs.findIndex((b) => b.id === activeBuffer(s)?.id);
  const self = tabs[at];
  const other = tabs[at + delta];
  if (
    self === undefined ||
    other === undefined ||
    (self.pinned === true) !== (other.pinned === true)
  )
    return none(s);
  const order = tabs.map((b) => b.id);
  order[at] = other.id;
  order[at + delta] = self.id;
  return none({ ...s, bufferOrder: order });
}

/** The Nth tab of the bufferline; 9 is the last one. */
function goToTab(c: CommandContext, n: number): Result {
  const tabs = orderedBuffers(c.state);
  const b = n === 9 ? tabs.at(-1) : tabs[n - 1];
  return b === undefined ? none(c.state) : goToBuffer(c.state, b.id, c.now);
}

const TABS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const bufferCommands: readonly AppCommand[] = [
  { id: "buffer.next", title: "Next buffer", run: (c) => cycle(c, 1) },
  { id: "buffer.prev", title: "Previous buffer", run: (c) => cycle(c, -1) },
  { id: "buffer.alternate", title: "Alternate buffer", run: alternate },
  { id: "buffer.go", title: "Go to buffer (number or name)", run: goByArg },
  {
    id: "buffer.pick",
    title: "Find buffer",
    run: (c) => openPicker(c, "buffers"),
  },
  {
    id: "buffer.delete",
    title: "Close buffer",
    run: (c) => closeActive(c, false),
  },
  {
    id: "buffer.deleteForce",
    title: "Close buffer without saving",
    run: (c) => closeActive(c, true),
  },
  {
    id: "buffer.closeOthers",
    title: "Close other buffers",
    run: (c) => closeUnpinnedWhere(c, (i, active) => i !== active),
  },
  {
    id: "buffer.closeLeft",
    title: "Close buffers to the left",
    run: (c) => closeUnpinnedWhere(c, (i, active) => i < active),
  },
  {
    id: "buffer.closeRight",
    title: "Close buffers to the right",
    run: (c) => closeUnpinnedWhere(c, (i, active) => i > active),
  },
  {
    id: "buffer.closeUnpinned",
    title: "Close unpinned buffers",
    run: (c) => closeUnpinnedWhere(c, () => true),
  },
  { id: "buffer.togglePin", title: "Toggle buffer pin", run: togglePin },
  { id: "buffer.moveNext", title: "Move buffer right", run: (c) => move(c, 1) },
  { id: "buffer.movePrev", title: "Move buffer left", run: (c) => move(c, -1) },
  ...TABS.map(
    (n): AppCommand => ({
      id: `buffer.goto${n}`,
      title: n === 9 ? "Go to last buffer" : `Go to buffer ${n}`,
      run: (c) => goToTab(c, n),
    }),
  ),
  {
    id: "file.saveAll",
    title: "Save all files",
    run: (c) => writeAll(c.state, c.now),
  },
];

const normal = (seq: string, id: string): Binding => ({
  scope: { mode: "normal" },
  seq,
  id,
});

export const bufferBindings: readonly Binding[] = [
  normal("]b", "buffer.next"),
  normal("[b", "buffer.prev"),
  normal("<C-^>", "buffer.alternate"),
  normal("<leader>bb", "buffer.alternate"),
  normal("<leader>fb", "buffer.pick"),
  normal("<leader>,", "buffer.pick"),
  normal("<leader>bd", "buffer.delete"),
  normal("<leader>bo", "buffer.closeOthers"),
  normal("<leader>bl", "buffer.closeLeft"),
  normal("<leader>br", "buffer.closeRight"),
  normal("<leader>bp", "buffer.togglePin"),
  normal("<leader>bP", "buffer.closeUnpinned"),
  normal("]B", "buffer.moveNext"),
  normal("[B", "buffer.movePrev"),
  ...TABS.map((n) => normal(`<leader>${n}`, `buffer.goto${n}`)),
];
