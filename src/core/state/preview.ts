import { resolveLink } from "../features/links/resolve";
import type { TextBuffer } from "../kernel/text/text-buffer";
import { type Doc, parseDoc } from "../lang/markdown/doc";
import type { HtmlCtx } from "../lang/markdown/html";
import { activeBuffer, activeWindow, bufferForPath } from "./buffers";
import type { CommandContext } from "./commands";
import { message, none, toast } from "./result";
import type { AppState, BufferState, Result } from "./types";

const encodePath = (path: string) =>
  path.split("/").map(encodeURIComponent).join("/");

/** The browser address of the preview on `port`, at `path` when given, carrying the server's `token`. */
export const previewUrl = (port: number, token: string, path?: string) =>
  `http://127.0.0.1:${port}/${path === undefined ? "" : encodePath(path)}?token=${token}`;

/** A note's analysis and text: the stored analysis when current, else parsed now. */
function noteOf(b: BufferState): { doc: Doc; text: TextBuffer } {
  const doc = b.analysis as Doc | undefined;
  return {
    doc: doc?.version === b.text.version ? doc : parseDoc(b.text),
    text: b.text,
  };
}

/** The analysis and text of the Markdown buffer open at `path`, so unsaved edits show. */
export function openNote(
  s: AppState,
  path: string,
): { doc: Doc; text: TextBuffer } | undefined {
  const b = bufferForPath(s, path);
  return b?.fileType === "markdown" ? noteOf(b) : undefined;
}

/** The note the browser follows and where its cursor is. */
export type FollowTarget = {
  path: string;
  version: number;
  line: number;
  doc: Doc;
  text: TextBuffer;
};

/** The active buffer when it is a listed Markdown note; nothing for code files or an empty window. */
export function followTarget(s: AppState): FollowTarget | undefined {
  const b = activeBuffer(s);
  if (b === undefined || b.listed === false || b.fileType !== "markdown")
    return undefined;
  return {
    path: b.path,
    version: b.text.version,
    line: activeWindow(s)?.content.cursor.line ?? 0,
    ...noteOf(b),
  };
}

/**
 * The HTML context of note `from`: links resolve through the index to page
 * addresses, images to `/file/` addresses, and embeds to the open buffer or,
 * for a closed note, whatever `load` reads from disk.
 */
export function htmlCtx(
  s: AppState,
  from: string,
  load: (path: string) => { doc: Doc; text: TextBuffer } | undefined,
): HtmlCtx {
  const resolve = (target: string) => {
    const r = resolveLink(s.index.ix, from, { target });
    return "path" in r ? r.path : undefined;
  };
  return {
    href: (t) => {
      const path = resolve(t);
      return path === undefined ? undefined : `/${encodePath(path)}`;
    },
    asset: (t) => {
      const path = resolve(t);
      return path === undefined ? undefined : `/file/${encodePath(path)}`;
    },
    embed: (t) => {
      const path = resolve(t);
      return path === undefined ? undefined : (openNote(s, path) ?? load(path));
    },
  };
}

/** `:Preview`: start the one server, or open the browser again when it already runs. */
export function startPreview(c: CommandContext): Result {
  const s = c.state;
  const p = s.preview;
  if (p.status === "on")
    return {
      state: s,
      effects: [
        {
          kind: "openUrl",
          url: previewUrl(p.port, p.token, followTarget(s)?.path),
        },
      ],
    };
  if (p.status === "starting") return none(s);
  return {
    state: { ...s, preview: { status: "starting" } },
    effects: [{ kind: "startPreview" }],
  };
}

/** `:PreviewStop`: stop the server, or say that none runs. */
export function stopPreview(c: CommandContext): Result {
  if (c.state.preview.status === "off")
    return message(c.state, "preview is not running");
  return { state: c.state, effects: [{ kind: "stopPreview" }] };
}

/** The server listens: record its port and token and open the browser at the current note. */
export function onPreviewStarted(
  s: AppState,
  a: { port: number; token: string },
): Result {
  return {
    state: { ...s, preview: { status: "on", port: a.port, token: a.token } },
    effects: [
      {
        kind: "openUrl",
        url: previewUrl(a.port, a.token, followTarget(s)?.path),
      },
    ],
  };
}

export function onPreviewStopped(s: AppState): Result {
  return message({ ...s, preview: { status: "off" } }, "preview stopped");
}

export function onPreviewFailed(s: AppState, a: { reason: string }): Result {
  return toast(
    { ...s, preview: { status: "off" } },
    "error",
    `preview failed: ${a.reason}`,
  );
}

/**
 * The system opener failed. For the preview the server keeps serving, so
 * show where it is; for a file, name it.
 */
export function onOpenUrlFailed(s: AppState, a: { url: string }): Result {
  return a.url.startsWith("http")
    ? toast(s, "info", `could not open a browser — ${a.url}`)
    : toast(s, "error", `could not open ${a.url}`);
}
