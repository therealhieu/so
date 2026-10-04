import { resolveLink } from "../features/links/resolve";
import type { Doc } from "../lang/markdown/doc";
import { embedOnly } from "../lang/markdown/render-key";
import { bufferForPath } from "./buffers";
import type { AppState, BufferId, BufferState, Effect, Result } from "./types";

type Embeds = NonNullable<BufferState["embeds"]>;

const isListedNote = (b: BufferState) =>
  b.listed !== false && b.fileType === "markdown";

/** Note paths one listed Markdown buffer embeds; images and other files are left out. */
export function embedTargets(s: AppState, b: BufferState): Set<string> {
  const doc = b.analysis as Doc | undefined;
  const out = new Set<string>();
  for (const link of doc?.scan.links ?? []) {
    if (link.kind !== "embed" || embedOnly(link.target) !== "embed") continue;
    const r = resolveLink(s.index.ix, b.path, { target: link.target });
    if ("path" in r && r.path !== b.path) out.add(r.path);
  }
  return out;
}

const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Keep embed targets loaded exactly while a listed note embeds them. Each
 * listed note records the targets it is waiting for; a target that is
 * neither open, waited for, nor refused gets one `read`, shared by every
 * note embedding it. Requests and refusals for targets a note no longer
 * embeds are dropped, and an unlisted buffer no listed note embeds is
 * removed once it has nothing to save. Unchanged buffers keep their identity.
 */
export function syncEmbeds(prev: AppState, r: Result): Result {
  const s = r.state;
  if (prev.buffers === s.buffers && prev.index.ix === s.index.ix) return r;
  const inFlight = new Set(
    Object.values(s.buffers).flatMap((b) => b.embeds?.requested ?? []),
  );
  const reads = new Set<string>();
  const wanted = new Set<string>();
  const changed: Record<BufferId, BufferState> = {};
  for (const b of Object.values(s.buffers)) {
    if (!isListedNote(b)) continue;
    const targets = embedTargets(s, b);
    for (const p of targets) wanted.add(p);
    const keep = (ps: readonly string[] = []) =>
      ps.filter((p) => targets.has(p));
    const requested = keep(b.embeds?.requested);
    const refused = keep(b.embeds?.refused);
    const fresh = [...targets].filter(
      (p) =>
        bufferForPath(s, p) === undefined &&
        !requested.includes(p) &&
        !refused.includes(p),
    );
    for (const p of fresh) if (!inFlight.has(p)) reads.add(p);
    const embeds: Embeds = { requested: [...requested, ...fresh], refused };
    const old = b.embeds;
    if (
      old === undefined
        ? targets.size > 0
        : !same(old.requested, embeds.requested) ||
          !same(old.refused, embeds.refused)
    )
      changed[b.id] = { ...b, embeds };
  }
  const evicted = Object.values(s.buffers).filter(
    (b) =>
      b.listed === false &&
      !wanted.has(b.path) &&
      !b.dirty &&
      b.save.kind === "idle",
  );
  if (
    Object.keys(changed).length === 0 &&
    evicted.length === 0 &&
    reads.size === 0
  )
    return r;
  const buffers = { ...s.buffers, ...changed };
  for (const b of evicted) delete buffers[b.id];
  const effects: Effect[] = [...reads].map((path) => ({ kind: "read", path }));
  return { state: { ...s, buffers }, effects: [...r.effects, ...effects] };
}

/** Whether a listed note is waiting for `path` as an embed target. */
export const embedRequested = (s: AppState, path: string): boolean =>
  Object.values(s.buffers).some(
    (b) => b.listed !== false && b.embeds?.requested.includes(path) === true,
  );

/** A read of `path` answered: no note waits for it any more, and a refusal is recorded on each. */
export function settleEmbedRead(
  s: AppState,
  path: string,
  refused: boolean,
): AppState {
  const changed: Record<BufferId, BufferState> = {};
  for (const b of Object.values(s.buffers)) {
    const e = b.embeds;
    if (e === undefined || !e.requested.includes(path)) continue;
    changed[b.id] = {
      ...b,
      embeds: {
        requested: e.requested.filter((p) => p !== path),
        refused: refused ? [...e.refused, path] : e.refused,
      },
    };
  }
  return Object.keys(changed).length === 0
    ? s
    : { ...s, buffers: { ...s.buffers, ...changed } };
}
