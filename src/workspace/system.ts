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
