import { fileURLToPath, pathToFileURL } from "node:url";
import type { FileClip } from "../core/state/types";

/** The `"+` register's system clipboard; `paste` is absent for copy-only providers. */
export type ClipboardProvider = {
  name: string;
  copy(text: string): Promise<void>;
  paste?(): Promise<string>;
};

/** What clipboard detection may look at; `run` returns a command's exit code. */
export type SysDeps = {
  platform: string;
  env: Record<string, string | undefined>;
  which: (cmd: string) => string | null;
  run: (argv: string[]) => Promise<number>;
};

/** A provider backed by argv commands (no shell): copy writes stdin, paste reads stdout. */
export function commandProvider(
  name: string,
  copyArgv: string[],
  pasteArgv?: string[],
): ClipboardProvider {
  const provider: ClipboardProvider = {
    name,
    async copy(text) {
      const p = Bun.spawn(copyArgv, {
        stdin: "pipe",
        stdout: "ignore",
        stderr: "ignore",
      });
      p.stdin.write(text);
      await p.stdin.end();
      if ((await p.exited) !== 0) throw new Error(`${name} failed`);
    },
  };
  if (pasteArgv === undefined) return provider;
  return {
    ...provider,
    async paste() {
      const p = Bun.spawn(pasteArgv, { stdout: "pipe", stderr: "ignore" });
      const text = await new Response(p.stdout).text();
      if ((await p.exited) !== 0) throw new Error(`${name} failed`);
      return text;
    },
  };
}

/** Copy-only provider writing OSC 52 through the terminal shell's callback. */
const osc52Provider = (osc52: (text: string) => void): ClipboardProvider => ({
  name: "osc52",
  copy: async (text) => osc52(text),
});

/** Neovim 0.11's order: pbcopy, wl-copy, xsel (if it works), xclip, tmux, then OSC 52. */
export async function detectClipboard(
  d: SysDeps,
  osc52: (text: string) => void,
): Promise<ClipboardProvider> {
  const has = (c: string) => d.which(c) !== null;
  if (d.platform === "darwin" && has("pbcopy"))
    return commandProvider("pbcopy", ["pbcopy"], ["pbpaste"]);
  if (d.env.WAYLAND_DISPLAY && has("wl-copy") && has("wl-paste"))
    return commandProvider(
      "wl-copy",
      ["wl-copy"],
      ["wl-paste", "--no-newline"],
    );
  if (d.env.DISPLAY && has("xsel") && (await d.run(["xsel", "-o", "-b"])) === 0)
    return commandProvider("xsel", ["xsel", "-i", "-b"], ["xsel", "-o", "-b"]);
  if (d.env.DISPLAY && has("xclip"))
    return commandProvider(
      "xclip",
      ["xclip", "-i", "-selection", "clipboard"],
      ["xclip", "-o", "-selection", "clipboard"],
    );
  if (d.env.TMUX && has("tmux"))
    return commandProvider(
      "tmux",
      ["tmux", "load-buffer", "-w", "-"],
      ["tmux", "save-buffer", "-"],
    );
  return osc52Provider(osc52);
}

/** The system clipboard's files; `read` gives `null` when it holds none. */
export type FileClipboard = {
  name: string;
  write(clip: FileClip): Promise<void>;
  read(): Promise<FileClip | null>;
};

/** Runs an argv (no shell) with optional stdin; gives the exit code and stdout. */
export type Exec = (
  argv: string[],
  input?: string,
) => Promise<{ code: number; stdout: string }>;

const bunExec: Exec = async (argv, input) => {
  const p = Bun.spawn(argv, {
    stdin: input === undefined ? "ignore" : "pipe",
    stdout: "pipe",
    stderr: "ignore",
  });
  if (input !== undefined && p.stdin !== undefined) {
    p.stdin.write(input);
    await p.stdin.end();
  }
  const stdout = await new Response(p.stdout).text();
  return { code: await p.exited, stdout };
};

/** No file clipboard: copies stay in so, and nothing is read. */
export const noFileClipboard: FileClipboard = {
  name: "none",
  write: async () => {},
  read: async () => null,
};

/** Absolute paths of the `file://` URLs among `urls`; others are skipped. */
function filePaths(urls: string[]): string[] {
  return urls.flatMap((u) => {
    try {
      return u.startsWith("file://") ? [fileURLToPath(u)] : [];
    } catch {
      return [];
    }
  });
}

const clipOf = (op: FileClip["op"], paths: string[]): FileClip | null =>
  paths.length === 0 ? null : { op, paths };

/** GNOME's `x-special/gnome-copied-files`: `copy` or `cut`, then one URL per line. */
export function parseGnomeCopied(text: string): FileClip | null {
  const [first, ...urls] = text.split(/\r?\n/).map((l) => l.trim());
  if (first !== "copy" && first !== "cut") return null;
  return clipOf(first, filePaths(urls));
}

/** A `text/uri-list` (RFC 2483: `#` lines are comments). */
export function parseUriList(
  text: string,
  op: FileClip["op"],
): FileClip | null {
  const urls = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("#"));
  return clipOf(op, filePaths(urls));
}

const fileUrls = (paths: string[]) => paths.map((p) => pathToFileURL(p).href);

const GNOME = "x-special/gnome-copied-files";
const URI_LIST = "text/uri-list";
const KDE_CUT = "application/x-kde-cutselection";

/**
 * A Linux clipboard tool that reads and writes one MIME type per call. Reads
 * prefer GNOME's list, which says copy or cut, then a URI list marked cut by
 * KDE. Writes offer GNOME's list, or a URI list under KDE, where Dolphin reads
 * only that (and a cut cannot be marked).
 */
function typedFileClipboard(
  name: string,
  argv: {
    types: string[];
    read: (type: string) => string[];
    write: (type: string) => string[];
  },
  kde: boolean,
  exec: Exec,
): FileClipboard {
  const readType = async (type: string): Promise<string | null> => {
    const r = await exec(argv.read(type));
    return r.code === 0 ? r.stdout : null;
  };
  return {
    name,
    async write(clip) {
      const urls = fileUrls(clip.paths);
      const [type, text] = kde
        ? [URI_LIST, `${urls.join("\r\n")}\r\n`]
        : [GNOME, `${clip.op}\n${urls.join("\n")}`];
      if ((await exec(argv.write(type), text)).code !== 0)
        throw new Error(`${name} failed`);
    },
    async read() {
      const listed = await exec(argv.types);
      if (listed.code !== 0) return null;
      const types = new Set(listed.stdout.split(/\r?\n/).map((t) => t.trim()));
      if (types.has(GNOME)) {
        const text = await readType(GNOME);
        return text === null ? null : parseGnomeCopied(text);
      }
      if (!types.has(URI_LIST)) return null;
      const text = await readType(URI_LIST);
      if (text === null) return null;
      const cut =
        types.has(KDE_CUT) && (await readType(KDE_CUT))?.trim() === "1";
      return parseUriList(text, cut ? "cut" : "copy");
    },
  };
}

const MAC_READ = `ObjC.import("AppKit");
function run() {
  const urls = $.NSPasteboard.generalPasteboard.readObjectsForClassesOptions(
    $([$.NSURL]),
    $({ NSPasteboardURLReadingFileURLsOnlyKey: true }),
  );
  const out = [];
  if (urls) for (let i = 0; i < urls.count; i++) out.push(urls.objectAtIndex(i).path.js);
  return JSON.stringify(out);
}`;

const MAC_WRITE = `ObjC.import("AppKit");
function run(argv) {
  const pb = $.NSPasteboard.generalPasteboard;
  pb.clearContents;
  if (!pb.writeObjects($(argv.map((p) => $.NSURL.fileURLWithPath(p))))) throw new Error("write refused");
}`;

/**
 * The macOS pasteboard through JavaScript for Automation; paths travel as
 * argv. Finder has no cut (Cmd+Opt+V moves at paste time), so reads are copies.
 */
function macFileClipboard(exec: Exec): FileClipboard {
  return {
    name: "osascript",
    async write(clip) {
      const argv = ["osascript", "-l", "JavaScript", "-e", MAC_WRITE];
      if ((await exec([...argv, ...clip.paths])).code !== 0)
        throw new Error("osascript failed");
    },
    async read() {
      const r = await exec(["osascript", "-l", "JavaScript", "-e", MAC_READ]);
      if (r.code !== 0) throw new Error("osascript failed");
      const paths: unknown = JSON.parse(r.stdout);
      return Array.isArray(paths)
        ? clipOf(
            "copy",
            paths.filter((p): p is string => typeof p === "string"),
          )
        : null;
    },
  };
}

/**
 * The file clipboard: osascript on macOS, wl-copy/wl-paste on Wayland, xclip
 * on X11; elsewhere (tmux, SSH, OSC 52) none, and files paste only inside so.
 */
export function detectFileClipboard(
  d: Pick<SysDeps, "platform" | "env" | "which">,
  exec: Exec = bunExec,
): FileClipboard {
  const has = (c: string) => d.which(c) !== null;
  const kde = (d.env.XDG_CURRENT_DESKTOP ?? "").toUpperCase().includes("KDE");
  if (d.platform === "darwin" && has("osascript"))
    return macFileClipboard(exec);
  if (d.env.WAYLAND_DISPLAY && has("wl-copy") && has("wl-paste"))
    return typedFileClipboard(
      "wl-copy",
      {
        types: ["wl-paste", "--list-types"],
        read: (t) => ["wl-paste", "--no-newline", "--type", t],
        write: (t) => ["wl-copy", "--type", t],
      },
      kde,
      exec,
    );
  if (d.env.DISPLAY && has("xclip"))
    return typedFileClipboard(
      "xclip",
      {
        types: ["xclip", "-o", "-selection", "clipboard", "-t", "TARGETS"],
        read: (t) => ["xclip", "-o", "-selection", "clipboard", "-t", t],
        write: (t) => ["xclip", "-i", "-selection", "clipboard", "-t", t],
      },
      kde,
      exec,
    );
  return noFileClipboard;
}

/** What `openUrl` needs from a process launcher; `Bun.spawn` by default. */
type Launch = (
  argv: string[],
  o: { stdout: "ignore"; stderr: "ignore" },
) => { exited: Promise<number> };

/** Open `url` in the default browser: `open` on macOS, `xdg-open` elsewhere. Rejects when the launcher fails or is missing. */
export async function openUrl(
  url: string,
  platform: string,
  spawn: Launch = Bun.spawn,
): Promise<void> {
  const argv = [platform === "darwin" ? "open" : "xdg-open", url];
  const p = spawn(argv, { stdout: "ignore", stderr: "ignore" });
  if ((await p.exited) !== 0) throw new Error(`${argv[0]} failed`);
}
