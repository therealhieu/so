import { type Key, splitKeys } from "../vim/keys";

/** Editor modes; owners declare more ("explorer", "picker", "base"). */
export type Mode = "normal" | "insert" | "visual" | "cmdline" | (string & {});

/** Where a binding applies; `filetype` omitted = every file type. */
export type KeyScope = { mode: Mode; filetype?: string };

/** One continuation of a pending prefix; `id` is set when the key completes a binding. */
export type WhichKeyItem = { key: Key; id?: string };

type Node = { id?: string; next: Map<Key, Node> };

type Lookup =
  | { kind: "command"; id: string }
  | { kind: "prefix"; next: WhichKeyItem[] }
  | { kind: "none" };

const scopeKey = (s: KeyScope) => `${s.mode}\u0000${s.filetype ?? ""}`;

/** Key-sequence trie per scope. */
export class Keymap {
  private readonly roots = new Map<string, Node>();

  /** Bind `seq` ("<leader>e", "<C-w>h") in `scope`; rebinding replaces. */
  bind(scope: KeyScope, seq: string, commandId: string): void {
    const key = scopeKey(scope);
    let node: Node = this.roots.get(key) ?? { next: new Map() };
    this.roots.set(key, node);
    for (const k of splitKeys(seq)) {
      let child: Node | undefined = node.next.get(k);
      if (child === undefined) {
        child = { next: new Map() };
        node.next.set(k, child);
      }
      node = child;
    }
    node.id = commandId;
  }

  /**
   * Resolve `pending`: `{mode, filetype}` bindings first, then `{mode}`.
   * A complete binding wins over a longer one; which-key items merge both levels.
   */
  lookup(scope: KeyScope, pending: Key[]): Lookup {
    const levels =
      scope.filetype === undefined
        ? [scope]
        : [scope, { mode: scope.mode } satisfies KeyScope];
    const nodes = levels.flatMap((s) => {
      let node = this.roots.get(scopeKey(s));
      for (const k of pending) node = node?.next.get(k);
      return node === undefined ? [] : [node];
    });
    const hit = nodes.find((n) => n.id !== undefined);
    if (hit?.id !== undefined) return { kind: "command", id: hit.id };
    const next = new Map<Key, WhichKeyItem>();
    for (const n of nodes)
      for (const [key, child] of n.next)
        if (!next.has(key))
          next.set(
            key,
            child.id === undefined ? { key } : { key, id: child.id },
          );
    return next.size === 0
      ? { kind: "none" }
      : { kind: "prefix", next: [...next.values()] };
  }
}
