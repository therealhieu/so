import type { TextBuffer } from "../kernel/text/text-buffer";
import type { DecorationProvider } from "../kernel/view/decorations";
import type { Highlighter } from "../kernel/view/types";

/** "text" and "base" in v1; other editors register their own kind. */
export type EditorKind = string;

/** One way to show a file. `input` builds the providers' per-frame input (default: the analysis). */
export type ViewSpec<S, I = S, C = unknown> = {
  id: string;
  readOnly?: boolean;
  /** Prose: the window caps its text at the readable width and centers it. */
  readable?: true;
  decorations: readonly DecorationProvider<I>[];
  input?: (analysis: S, ctx: C) => I;
};

export type EditorKindSpec<St = unknown> = {
  id: EditorKind;
  /** The kind's window state for `path`; `subpath` is the "#…" the window was opened at. */
  open(path: string, text: string, subpath?: string): St;
};

export class EditorKindRegistry {
  private readonly kinds = new Map<EditorKind, EditorKindSpec>();

  register(spec: EditorKindSpec): void {
    if (this.kinds.has(spec.id))
      throw new Error(`editor kind "${spec.id}" is already registered`);
    this.kinds.set(spec.id, spec);
  }

  get(id: EditorKind): EditorKindSpec | undefined {
    return this.kinds.get(id);
  }
}

export type FileType<S = unknown> = {
  id: string;
  match: { extensions?: readonly string[]; names?: readonly string[] };
  editor: EditorKind;
  /** The first view is the default. */
  views: readonly ViewSpec<S>[];
  highlighter?: Highlighter;
  analyze?: (buf: TextBuffer, prev?: S) => S;
  /** Files of this type are never written. */
  readOnly?: true;
  /** Files of this type are never read as text; their editor kind draws them. */
  binary?: true;
};

// biome-ignore lint/suspicious/noExplicitAny: file types differ in their analysis type.
type AnyFileType = FileType<any>;

/** The plain-text file type every unmatched path falls back to. */
export const textFileType: FileType = {
  id: "text",
  match: {},
  editor: "text",
  views: [{ id: "source", decorations: [] }],
};

/** File types by id, extension, and file name; registered once at startup. */
export class FileTypeRegistry {
  private readonly byId = new Map<string, AnyFileType>();
  private readonly byExtension = new Map<string, AnyFileType>();
  private readonly byName = new Map<string, AnyFileType>();

  constructor(private readonly fallback: FileType) {
    this.register(fallback);
  }

  /** Throws when the id, an extension, or a file name is already taken. */
  register(ft: AnyFileType): void {
    if (this.byId.has(ft.id))
      throw new Error(`file type "${ft.id}" is already registered`);
    const extensions = (ft.match.extensions ?? []).map((e) => e.toLowerCase());
    const names = ft.match.names ?? [];
    for (const e of extensions)
      if (this.byExtension.has(e))
        throw new Error(`extension "${e}" is already registered`);
    for (const n of names)
      if (this.byName.has(n))
        throw new Error(`file name "${n}" is already registered`);
    this.byId.set(ft.id, ft);
    for (const e of extensions) this.byExtension.set(e, ft);
    for (const n of names) this.byName.set(n, ft);
  }

  /** Extension, then file name, then the fallback. */
  forPath(path: string): FileType {
    const name = path.slice(path.lastIndexOf("/") + 1);
    const dot = name.lastIndexOf(".");
    const ext = dot > 0 ? name.slice(dot).toLowerCase() : undefined;
    return (
      (ext === undefined ? undefined : this.byExtension.get(ext)) ??
      this.byName.get(name) ??
      this.fallback
    );
  }

  get(id: string): FileType | undefined {
    return this.byId.get(id);
  }
}
