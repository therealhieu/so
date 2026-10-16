// Plays the README intro inside a real terminal. It runs so on a PTY, passes
// the terminal's own input through (so graphics capability replies reach so),
// and types the tour. Each beat's start and end go to a marks file, so the
// recording can be cut to those spans. Run by scripts/record-intro.ts.
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** What scripts/record-intro.ts hands over, as a JSON file. */
export type PlaySettings = {
  /** The window title the recorder looks for. */
  title: string;
  workspace: string;
  env: Record<string, string>;
  /** Appended with one `{ name, at }` JSON line per mark (epoch ms). */
  marks: string;
  /** Playing starts once this file exists (the recorder is running). */
  go: string;
  /** Written when the tour is over, to stop the recorder. */
  stop: string;
};

/** A mouse drag across PDF text: cells, 1-based, as the terminal reports them. */
export type Drag = { from: [number, number]; to: [number, number] };

const ESC = "\x1b";
const ENTER = "\r";
const BS = "\x7f";
const TAB = "\t";
const CTRL_N = "\x0e";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Escape sequences in so's output: CSI, OSC, and APC (kitty graphics) strings, and two-byte escapes. */
const ESCAPES =
  // biome-ignore lint/suspicious/noControlCharactersInRegex: matching terminal escapes
  /\x1b\[[0-?]*[ -/]*[@-~]|\x1b[\]_P^][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[@-Z\\-_]/g;

class Player {
  private lastOutput = Date.now();
  /** Bytes so has written since it started. */
  private bytes = 0;
  /** Text so drew since the last `output` call began, escapes removed. */
  private recent = "";
  private readonly decoder = new TextDecoder();

  constructor(
    private readonly terminal: Bun.Terminal,
    private readonly marksFile: string,
  ) {}

  /** Note output, for `settle`, `output`, and `bulk`. */
  saw(data: Uint8Array): void {
    this.lastOutput = Date.now();
    this.bytes += data.length;
    this.recent = (
      this.recent + this.decoder.decode(data, { stream: true })
    ).slice(-200_000);
  }

  /** Waits until so draws text matching `pattern`, or `maxMs` passes. */
  async output(pattern: RegExp, maxMs: number): Promise<void> {
    this.recent = "";
    const until = Date.now() + maxMs;
    while (
      !pattern.test(this.recent.replace(ESCAPES, "")) &&
      Date.now() < until
    )
      await sleep(50);
  }

  /**
   * Waits until so writes `minBytes` more, or `maxMs` passes. A picture is a
   * large escape payload, while a text redraw is a few kilobytes.
   */
  async bulk(minBytes: number, maxMs: number): Promise<void> {
    const from = this.bytes;
    const until = Date.now() + maxMs;
    while (this.bytes - from < minBytes && Date.now() < until) await sleep(50);
  }

  mark(name: string): void {
    appendFileSync(
      this.marksFile,
      `${JSON.stringify({ name, at: Date.now() })}\n`,
    );
  }

  keys(text: string): void {
    this.terminal.write(text);
  }

  /** Types `text` one key at a time, at a readable pace. */
  async type(text: string, perKey = 60): Promise<void> {
    for (const char of text) {
      this.terminal.write(char);
      await sleep(perKey);
    }
  }

  /** Waits until so has drawn nothing for `quietMs`, or `maxMs` passes. */
  async settle(quietMs = 400, maxMs = 8000): Promise<void> {
    const until = Date.now() + maxMs;
    await sleep(quietMs);
    while (Date.now() - this.lastOutput < quietMs && Date.now() < until)
      await sleep(50);
  }

  /** A left-button drag in SGR mouse encoding, moving one cell per step. */
  async drag({ from, to }: Drag, perStep = 25): Promise<void> {
    const [x1, y1] = from;
    const [x2, y2] = to;
    this.terminal.write(`${ESC}[<0;${x1};${y1}M`);
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
    for (let i = 1; i <= steps; i++) {
      const x = Math.round(x1 + ((x2 - x1) * i) / steps);
      const y = Math.round(y1 + ((y2 - y1) * i) / steps);
      this.terminal.write(`${ESC}[<32;${x};${y}M`);
      await sleep(perStep);
    }
    this.terminal.write(`${ESC}[<0;${x2};${y2}m`);
  }

  /** Opens a workspace file through the file picker, typing `query`. */
  async find(query: string): Promise<void> {
    this.keys(" ff");
    await sleep(250);
    await this.type(query);
    await sleep(500);
    this.keys(ENTER);
  }
}

/** Where the PDF beat drags, from the layout at the recorded window size. */
export const PDF_DRAG: Drag = { from: [8, 17], to: [60, 18] };

async function tour(p: Player): Promise<void> {
  await p.settle(600, 6000);
  // Close the explorer so notes get the whole width, and let the index toast fade.
  p.keys(" e");
  await p.settle();
  await sleep(3500);

  p.mark("picker");
  p.keys(" ff");
  await sleep(300);
  await p.type("raft", 90);
  await sleep(900);
  p.mark("notes");
  p.keys(ENTER);
  await p.settle(500);
  await sleep(1800);
  // From the window's last line, each j scrolls: the table, callouts, tasks,
  // code, picture, and PDF page roll past.
  p.keys("L");
  await sleep(300);
  await p.type("j".repeat(26), 200);
  await p.settle();
  await sleep(800);
  p.mark("notes.end");
  p.keys("gg");
  await p.settle();

  // Each theme in the list repaints the note while it is selected.
  p.mark("themes");
  p.keys(" us");
  await sleep(400);
  await p.type("theme", 70);
  await sleep(300);
  p.keys(ENTER);
  await sleep(700);
  for (let i = 0; i < 5; i++) {
    p.keys(CTRL_N);
    await p.settle(200);
    await sleep(500);
  }
  p.keys(ENTER);
  await p.settle();
  p.keys(ESC);
  await p.settle();
  await sleep(900);
  p.mark("themes.end");

  await p.find("Reading");
  await p.settle();
  p.mark("base");
  await sleep(500);
  await p.type("jjjjll", 110);
  p.keys("i");
  await sleep(300);
  await p.type(BS.repeat(7), 40);
  await p.type("done", 80);
  await sleep(250);
  p.keys(ENTER);
  await p.settle();
  await sleep(1300);
  p.mark("base.end");

  await p.find("consensus");
  await p.settle(700);
  p.mark("pdf");
  await sleep(800);
  await p.drag(PDF_DRAG);
  await sleep(700);
  p.keys("h");
  await p.settle();
  await sleep(1200);
  p.mark("pdf.end");

  await p.find("lakeside");
  await p.settle();
  p.mark("image");
  await sleep(900);
  for (const key of "++ll") {
    p.keys(key);
    await p.settle(200);
    await sleep(350);
  }
  await sleep(600);
  p.mark("image.end");

  p.keys(" ff");
  await sleep(250);
  await p.type("dashboard");
  await sleep(500);
  // Chrome starts on the first page; its first frame is a large picture.
  const opened = p.bulk(100_000, 20000);
  p.keys(ENTER);
  await opened;
  await p.settle(600, 5000);
  p.mark("html");
  await sleep(2600);
  p.mark("html.end");

  await p.find("cluster.db");
  await p.settle();
  p.mark("sqlite");
  await sleep(1000);
  p.keys("s");
  await sleep(400);
  await p.type("select term, count(*) from log_en", 50);
  p.keys(TAB);
  await sleep(300);
  await p.type(" group by term", 50);
  await sleep(900);
  p.keys(ENTER);
  await p.settle();
  await sleep(1600);
  p.mark("sqlite.end");

  p.mark("code");
  await p.find("lib.rs");
  await sleep(600);
  p.keys("/HEARTBEAT");
  p.keys(ENTER);
  await sleep(400);
  p.keys(" ghp");
  await p.settle();
  await sleep(1600);
  p.mark("git.end");
  p.keys(ESC);
  // rust-analyzer indexes the standard library before hints and hovers.
  await p.settle(1500, 30000);
  p.keys("/election_timeout(seed)");
  p.keys(ENTER);
  await p.settle();
  await p.settle(1000, 10000);
  p.mark("code.ready");
  await sleep(400);
  p.keys("K");
  await p.output(/A randomized election timeout/, 8000);
  await sleep(2800);
  p.mark("code.end");
}

async function main(): Promise<void> {
  const settings = (await Bun.file(
    process.argv[2] as string,
  ).json()) as PlaySettings;
  // Set before so starts, which may retitle the window; the recorder finds it by this.
  process.stdout.write(`${ESC}]2;${settings.title}\x07`);
  let player: Player | undefined;
  const terminal = new Bun.Terminal({
    cols: process.stdout.columns,
    rows: process.stdout.rows,
    data: (_t, data) => {
      process.stdout.write(data);
      player?.saw(data);
    },
  });
  player = new Player(terminal, settings.marks);
  process.stdin.setRawMode(true);
  process.stdin.on("data", (data) => terminal.write(data));
  process.stdout.on("resize", () =>
    terminal.resize(process.stdout.columns, process.stdout.rows),
  );

  while (!existsSync(settings.go)) await sleep(50);
  const so = Bun.spawn(
    [
      process.execPath,
      join(import.meta.dir, "../../src/app/main.ts"),
      settings.workspace,
    ],
    { terminal, env: { ...process.env, ...settings.env } },
  );
  try {
    await tour(player);
  } finally {
    writeFileSync(settings.stop, "");
    await sleep(300);
    terminal.write(`${ESC}:qa!${ENTER}`);
    await Promise.race([so.exited, sleep(5000)]);
    so.kill();
    terminal.close();
    process.stdin.setRawMode(false);
    process.exit(0);
  }
}

if (import.meta.main) {
  // The window closes when this exits, so a failure is kept beside the settings.
  const log = join(dirname(process.argv[2] ?? "."), "play.log");
  try {
    await main();
  } catch (error) {
    writeFileSync(log, `${(error as Error).stack ?? error}\n`);
    process.exit(1);
  }
}
