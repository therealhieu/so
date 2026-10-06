import { afterEach, expect, spyOn, test } from "bun:test";
import { readFileSync } from "node:fs";
import { OptimizedBuffer, TextAttributes } from "@opentui/core";
import { createTerminalCapabilities } from "@opentui/core/testing";
import { createToolHost } from "../../src/app/tool-host";
import { normalizeIndexText } from "../../src/core/features/git/index-text";
import { parseStatus } from "../../src/core/features/git/status";
import type { Effect, IndexEntry, RepoInfo } from "../../src/core/state/types";
import { FOREIGN_MODES_RESET } from "../../src/ui/shell";
import { type Theme, themes } from "../../src/ui/theme";
import { stamp } from "../support/state";
import {
  cellStyle,
  type Mounted,
  type MountOptions,
  mountShell,
} from "../support/ui";

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

const REPO: RepoInfo = {
  top: "~/notes",
  gitDir: "~/notes/.git",
  commonDir: "~/notes/.git",
  prefix: "",
  head: { kind: "branch", name: "main" },
};

const OPENING = '"notes/plan.md" written · opening lazygit';

/** config.toml with `color`; notes keep opening in the editable live view. */
const colorConfig = (color: string) =>
  `color = "${color}"\n[preview]\nmode = "live"\n`;
const NO_COLOR_CONFIG = colorConfig("never");

/** Let any scheduled frame render. */
const settle = () => Bun.sleep(20);

/** An index entry holding `text`, as `git ls-files` and `cat-file` read it. */
const tracked = (text: string, conflicted = false): IndexEntry => ({
  kind: "tracked",
  oid: "a".repeat(40),
  mode: "100644",
  conflicted,
  text: normalizeIndexText(text, "lf"),
});

/**
 * The shell inside `repo`, with the explorer closed so windows start at
 * x = 0 unless `explorer` keeps it open.
 */
async function inRepo(
  o: MountOptions & { repo?: RepoInfo; explorer?: boolean },
): Promise<Mounted> {
  const { repo = REPO, explorer = false, ...mount } = o;
  const x = await mountShell(mount);
  x.store.dispatch({ type: "gitDetected", repo });
  if (!explorer) x.keys("<leader>e");
  return x;
}

/** Open `path` showing `text` while the index holds `index`; `null` is untracked. */
function openWithIndex(
  x: Mounted,
  path: string,
  text: string,
  index: string | null,
): void {
  x.open(path, text);
  x.store.dispatch({
    type: "gitIndexRead",
    path,
    entry: index === null ? { kind: "untracked" } : tracked(index),
  });
}

const textOf = (lines: readonly string[]) => `${lines.join("\n")}\n`;

async function rowsOf(x: Mounted): Promise<string[]> {
  return (await x.frame()).split("\n");
}

/** A theme token's style in the form `cellStyle` reports. */
function styleOf(theme: Theme, token: string) {
  const st = theme.style(token);
  const color = (c: typeof st.fg) =>
    c.intent === "default" ? "default" : c.toInts().join(",");
  return { fg: color(st.fg), bg: color(st.bg), attrs: st.attrs };
}

/** Cell 0 of the window rows, one per buffer line from the bufferline down. */
const changeColumn = (rows: readonly string[], n: number) =>
  rows.slice(1, 1 + n).map((r) => [...r][0] ?? " ");

/** One hunk of each kind against the index; the expected sign per buffer line. */
const SIGN_INDEX = [
  "top",
  ...Array.from({ length: 12 }, (_, i) => `a${i + 1}`),
].map((l) => `- ${l}`);
const SIGN_BUFFER = [
  "a1",
  "a2",
  "NEW",
  "a3",
  "A4!",
  "a5",
  "a7",
  "X8",
  "X9",
  "a11",
  "a12",
].map((l) => `- ${l}`);
const SIGN_TOKENS: Record<string, string> = {
  "‾": "gitTopDelete",
  "+": "gitAdd",
  "~": "gitChange",
  _: "gitDelete",
  "≃": "gitChangeDelete",
  "┆": "gitUntracked",
  " ": "gutter",
};
const SIGNS = ["‾", " ", "+", " ", "~", "_", " ", "~", "≃", " ", " "];

test("the frame with the pre-suspend message is rendered before suspend and nothing after", async () => {
  m = await mountShell({ cols: 120, rows: 36 });
  const x = m;
  x.store.dispatch({ type: "gitDetected", repo: REPO });
  x.keys("<leader>e");
  x.open("notes/plan.md", "# Plan\n");
  x.keys("Ax<Esc><leader>gg");
  x.store.dispatch({ type: "saved", path: "notes/plan.md", stamp: stamp(2) });
  expect(x.effects.filter((e) => e.kind === "runTool")).toHaveLength(1);
  expect(x.store.get().config.mouse).toBe(true);

  const frames = x.record();
  await x.shell.flush();
  expect(frames.recordedFrames.at(-1)?.frame).toContain(OPENING);

  const before = frames.recordedFrames.length;
  x.shell.suspend();
  x.store.dispatch({ type: "resize", cols: 120, rows: 36 });
  x.store.dispatch({ type: "dirListed", dir: "", entries: [] });
  await settle();
  expect(frames.recordedFrames.length).toBe(before);
  expect(x.t.renderer.useMouse).toBe(false);
  expect(x.writes).toEqual([]);

  x.shell.resetForeignModes();
  expect(x.writes).toEqual([FOREIGN_MODES_RESET]);
  x.shell.resume();
  await settle();
  expect(frames.recordedFrames.length).toBeGreaterThan(before);
  expect(x.t.renderer.useMouse).toBe(true);
  frames.stop();
});

const PNG = new Uint8Array(
  readFileSync(new URL("../fixtures/images/wide.png", import.meta.url)),
);
const KITTY = {
  caps: createTerminalCapabilities({ kitty_graphics: true }),
  hasResolution: true,
};

test("images visible before suspend are drawn again after resume", async () => {
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    m = await mountShell({
      cols: 100,
      rows: 40,
      capabilities: KITTY,
      files: { "images/diagram.png": PNG },
    });
    const x = m;
    x.store.dispatch({
      type: "indexBatch",
      summaries: [],
      files: ["notes/diagram.md", "images/diagram.png"],
      done: 0,
      total: 0,
    });
    x.keys("<leader>e");
    x.open("notes/diagram.md", "# Diagram\n\n![[diagram.png]]\n\nText\n");
    await x.frame();
    await Bun.sleep(0);
    await x.shell.flush();
    expect(draw).toHaveBeenCalled();

    x.shell.suspend();
    draw.mockClear();
    x.store.dispatch({ type: "resize", cols: 100, rows: 40 });
    await settle();
    expect(draw).not.toHaveBeenCalled();

    x.shell.resume();
    await settle();
    expect(draw).toHaveBeenCalledTimes(1);
    expect(draw.mock.calls[0]?.[11]).toBe("kitty");
  } finally {
    draw.mockRestore();
  }
});

test("destroying the shell while suspended restores the terminal once", async () => {
  m = await mountShell({ cols: 80, rows: 24 });
  m.shell.suspend();
  m.shell.destroy();
  m.shell.destroy();
  expect(m.t.renderer.isDestroyed).toBe(true);
  m = undefined;
});

test("changed lines show their git sign left of the line number", async () => {
  const body = Array.from({ length: 30 }, (_, i) =>
    i === 19 ? `line 20${" long words".repeat(14)}` : `line ${i + 1}`,
  );
  const index = body.filter((_, i) => i !== 17 && i !== 19);
  m = await inRepo({ cols: 120, rows: 36 });
  openWithIndex(m, "notes/plan.md", textOf(body), textOf(index));
  m.keys("18G");
  const rows = await rowsOf(m);
  const at = (text: string) => rows.findIndex((r) => r.includes(text));
  expect(rows[at("line 18")]).toStartWith("+  18 ▕line 18");
  expect(rows[at("line 17")]).toStartWith("    1  line 17");
  const long = at("line 20 long");
  expect(rows[long]).toStartWith("+   2  line 20 long");
  // The wrapped row of the added line has a blank change cell and no number.
  const wrapped = [...(rows[long + 1] ?? "")];
  expect(wrapped.slice(0, 7).join("")).toBe("       ");
  expect(wrapped[7]).not.toBe(" ");

  const v1 = await mountShell({ cols: 120, rows: 36 });
  try {
    v1.keys("<leader>e");
    v1.open("notes/plan.md", textOf(body));
    v1.keys("18G");
    const plain = await rowsOf(v1);
    const row = plain.find((r) => r.includes("line 17")) ?? "";
    expect(row).toStartWith("   1  line 17");
    expect((rows[at("line 17")] ?? "").indexOf("line 17")).toBe(
      row.indexOf("line 17") + 1,
    );
  } finally {
    v1.destroy();
  }
});

for (const [name, o] of [
  ["dark", { theme: "dark" }],
  ["light", { theme: "light" }],
  ["no colour", { config: NO_COLOR_CONFIG }],
] as const)
  test(`every sign kind shows its glyph in every view (${name})`, async () => {
    m = await inRepo({ cols: 120, rows: 36, ...o });
    const x = m;
    const theme = themes[name === "no colour" ? "nocolor" : name];
    const check = async (signs: readonly string[]) => {
      const rows = await rowsOf(x);
      expect(changeColumn(rows, signs.length)).toEqual([...signs]);
      const spans = x.t.captureSpans().lines;
      signs.forEach((g, i) => {
        expect(cellStyle(spans, 0, 1 + i)).toEqual(
          styleOf(theme, SIGN_TOKENS[g] ?? ""),
        );
      });
    };
    /** Check every view, cycling live → source → reading. */
    const everyView = async (path: string, signs: readonly string[]) => {
      const seen: string[] = [];
      for (let i = 0; i < 3; i++) {
        const b = Object.values(x.store.get().buffers).find(
          (y) => y.path === path,
        );
        seen.push(b?.view ?? "");
        await check(signs);
        x.keys("<leader>m");
      }
      expect(seen.sort()).toEqual(["live", "reading", "source"]);
    };
    openWithIndex(x, "notes/plan.md", textOf(SIGN_BUFFER), textOf(SIGN_INDEX));
    x.keys("G");
    await everyView("notes/plan.md", SIGNS);
    openWithIndex(x, "notes/new.md", textOf(["- one", "- two"]), null);
    x.keys("G");
    await everyView("notes/new.md", ["┆", "┆"]);
    if (theme.name === "nocolor") {
      const colours = new Set(
        x.t
          .captureSpans()
          .lines.flatMap((l) => l.spans)
          .flatMap((sp) => [sp.fg.intent, sp.bg.intent]),
      );
      expect([...colours]).toEqual(["default"]);
    }
  });

test("a rendered block shows the git sign of a changed hidden line", async () => {
  const note = (third: string) => [
    "# Flow",
    "",
    "```mermaid",
    "flowchart LR",
    third,
    "  B --> C",
    "```",
    "",
    "after",
  ];
  const signCell = (rows: string[], gw: number) =>
    rows.map((r) => [...r][gw - 1] ?? " ");
  m = await inRepo({ cols: 120, rows: 36 });
  openWithIndex(
    m,
    "notes/flow.md",
    textOf(note("  A --> D")),
    textOf(note("  A --> B")),
  );
  m.keys("gg");
  const rows = await rowsOf(m);
  expect(rows.join("\n")).not.toContain("```mermaid");
  const marked = rows.flatMap((r, y) => ([...r][0] === "~" ? [y] : []));
  expect(marked).toHaveLength(1);
  const blockRow = marked[0] ?? -1;
  expect(rows[blockRow]).not.toContain("# Flow");
  expect(rows[blockRow - 1]).toStartWith("    1  ");

  const v1 = await mountShell({ cols: 120, rows: 36 });
  try {
    v1.keys("<leader>e");
    v1.open("notes/flow.md", textOf(note("  A --> D")));
    v1.keys("gg");
    const plain = await rowsOf(v1);
    // The v1 sign cell of every row is the same with the change column.
    expect(signCell(rows, 7).slice(1, 12)).toEqual(
      signCell(plain, 6).slice(1, 12),
    );
  } finally {
    v1.destroy();
  }
});

test("a reveal sign and a git sign share a line, and nothing changes outside a repository", async () => {
  const body = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`);
  const index = body.map((l, i) => (i === 4 ? "line five" : l));
  m = await inRepo({ cols: 120, rows: 36 });
  openWithIndex(m, "notes/plan.md", textOf(body), textOf(index));
  m.keys("5G");
  const repoRow = (await rowsOf(m)).find((r) => r.includes("line 5")) ?? "";
  expect(repoRow).toStartWith("~   5 ▕line 5");

  /** The same scene without a repository, or with git off. */
  const scene = async (detect?: { notice?: string }) => {
    const x = await mountShell({ cols: 120, rows: 36 });
    try {
      x.keys("<leader>e");
      x.open("notes/plan.md", textOf(body));
      x.store.dispatch({
        type: "gitIndexRead",
        path: "notes/plan.md",
        entry: tracked(textOf(index)),
      });
      x.keys("5G");
      // Discovery answers after the first frame; a notice stays until the next key.
      if (detect !== undefined)
        x.store.dispatch({ type: "gitDetected", repo: null, ...detect });
      return await rowsOf(x);
    } finally {
      x.destroy();
    }
  };
  const v1 = await scene();
  expect(v1.find((r) => r.includes("line 5"))).toStartWith("   5 ▕line 5");
  expect(v1.join("\n")).not.toContain("⎇");
  // Git missing: discovery answers no repository.
  expect(await scene({})).toEqual(v1);
  // Git too old: the notice is the only difference.
  const old = await scene({
    notice: "git 2.20.1 is older than 2.31; git features off",
  });
  // The frame ends in the message row, the statusline, and an empty line.
  const unchanged = (rows: string[]) => [...rows.slice(0, -3), rows.at(-2)];
  expect(unchanged(old)).toEqual(unchanged(v1));
  expect(old.at(-3)?.trimEnd()).toEndWith(
    "git 2.20.1 is older than 2.31; git features off",
  );
});

test("clicks and the cursor land on the painted text with the change column", async () => {
  const body = ["one", "two", "three and more", "four", "abcdef", "six"];
  const index = body.map((l) => `${l}!`);
  m = await inRepo({ cols: 120, rows: 36 });
  openWithIndex(m, "notes/plan.md", textOf(body), textOf(index));
  const cursor = () => {
    const s = m?.store.get();
    return s?.windows.byId[s.windows.active]?.content.cursor;
  };
  let rows = await rowsOf(m);
  // Text starts after the change cell, four number cells, a space, and the sign cell.
  const gw = 7;
  let y = rows.findIndex((r) => r.includes("three and more"));
  await m.mouse.click(gw + 5, y);
  expect(cursor()).toEqual({ line: 2, col: 5 });
  await m.frame();
  let c = m.t.renderer.getCursorState();
  expect({ x: c.x - 1, y: c.y - 1 }).toEqual({ x: gw + 5, y });

  rows = await rowsOf(m);
  y = rows.findIndex((r) => r.includes("abcdef"));
  const cx = [...(rows[y] ?? "")].indexOf("c", gw);
  await m.mouse.click(cx, y);
  expect(cursor()).toEqual({ line: 4, col: 2 });
  await m.frame();
  c = m.t.renderer.getCursorState();
  expect({ x: c.x - 1, y: c.y - 1 }).toEqual({ x: cx, y });
});

/** Index and buffer lines whose hunks count 2 added, 2 changed, and 3 removed lines. */
const COUNT_INDEX = Array.from({ length: 12 }, (_, i) => `l${i + 1}`);
const COUNT_BUFFER = [
  "l1",
  "n1",
  "n2",
  "l2",
  "l3",
  "l4",
  "C5",
  "C6",
  "l7",
  "l11",
  "l12",
];

const statusRowOf = async (x: Mounted) =>
  (await rowsOf(x))[x.store.get().terminal.rows - 1] ?? "";

/** The statusline for `path` in `repo`, with `index` against the counting buffer. */
async function statusFor(o: {
  repo?: RepoInfo;
  index: readonly string[] | null;
  cols?: number;
  path?: string;
  color?: string;
}): Promise<string> {
  m?.destroy();
  m = await inRepo({
    cols: o.cols ?? 120,
    rows: 36,
    ...(o.repo === undefined ? {} : { repo: o.repo }),
    ...(o.color === undefined ? {} : { config: colorConfig(o.color) }),
  });
  openWithIndex(
    m,
    o.path ?? "notes/plan.md",
    textOf(COUNT_BUFFER),
    o.index === null ? null : textOf(o.index),
  );
  return statusRowOf(m);
}

test("the statusline git segment reads its variants and drops first", async () => {
  const after = "notes/plan.md  ";
  expect(await statusFor({ index: COUNT_INDEX })).toContain(
    `${after}⎇ main +2 ~2 -3  `,
  );
  expect(await statusFor({ index: COUNT_BUFFER })).toContain(
    `${after}⎇ main  `,
  );
  const rebasing: RepoInfo = {
    ...REPO,
    head: { kind: "detached", short: "a1b2c3d" },
    op: "rebasing",
  };
  expect(await statusFor({ repo: rebasing, index: COUNT_INDEX })).toContain(
    `${after}⎇ a1b2c3d rebasing +2 ~2 -3  `,
  );
  expect(
    await statusFor({ repo: { ...REPO, op: "merging" }, index: COUNT_BUFFER }),
  ).toContain(`${after}⎇ main merging  `);
  const unborn: RepoInfo = { ...REPO, head: { kind: "unborn", name: "main" } };
  expect(await statusFor({ repo: unborn, index: COUNT_INDEX })).toContain(
    `${after}⎇ main  `,
  );
  expect(await statusFor({ index: null })).toContain(`${after}⎇ main  `);

  // A dirty buffer keeps its dot right after the path, before the segment.
  m?.keys("ggAx<Esc>");
  expect(await statusRowOf(m as Mounted)).toContain(
    "notes/plan.md ●  ⎇ main  ",
  );

  // Narrow terminals drop the segment with the other optional ones.
  expect(await statusFor({ index: COUNT_INDEX, cols: 80 })).not.toContain("⎇");
  // A row too long for the path drops the segment before the preview.
  const long = "notes/a-very-long-folder-name-here/plan.md";
  const row = await statusFor({ index: COUNT_INDEX, cols: 100, path: long });
  expect(row).not.toContain("⎇");
  expect(row).toContain("preview off");
  expect(row).toContain("plan.md");
});

test("the statusline git segment colours each part", async () => {
  for (const [color, theme] of [
    ["auto", themes.dark],
    ["never", themes.nocolor],
  ] as const) {
    const rebasing: RepoInfo = {
      ...REPO,
      head: { kind: "detached", short: "a1b2c3d" },
      op: "rebasing",
    };
    const row = await statusFor({ repo: rebasing, index: COUNT_INDEX, color });
    const x = m as Mounted;
    const y = x.store.get().terminal.rows - 1;
    const spans = x.t.captureSpans().lines;
    /** The style of the first cell of `text` on the status row. */
    const at = (text: string) =>
      cellStyle(spans, [...row.slice(0, row.indexOf(text))].length, y);
    expect(at("⎇")).toEqual(styleOf(theme, "statusGitRef"));
    expect(at("rebasing")).toEqual(styleOf(theme, "statusGitOp"));
    expect(at("+2")).toEqual(styleOf(theme, "statusGitAdd"));
    expect(at("~2")).toEqual(styleOf(theme, "statusGitChange"));
    expect(at("-3")).toEqual(styleOf(theme, "statusGitDelete"));
  }
  expect(styleOf(themes.nocolor, "statusGitOp").attrs).toBe(
    TextAttributes.BOLD | TextAttributes.UNDERLINE,
  );
});

/** One record per change, as `git status --porcelain=v2 -z --branch` prints them. */
const MARKER_STATUS = parseStatus(
  [
    "# branch.oid 0123456789abcdef0123456789abcdef01234567",
    "# branch.head main",
    `1 M. N... 100644 100644 100644 ${"1".repeat(40)} ${"2".repeat(40)} daily/2026-10-02.md`,
    `1 .D N... 100644 100644 000000 ${"3".repeat(40)} ${"3".repeat(40)} daily/2026-10-03.md`,
    `1 .M N... 100644 100644 100644 ${"4".repeat(40)} ${"4".repeat(40)} projects/so-roadmap.md`,
    "? projects/ideas/ideas.md",
    "? projects/ideas/kanban.md",
    `u UU N... 100644 100644 100644 100644 ${"5".repeat(40)} ${"6".repeat(40)} ${"7".repeat(40)} people/linh.md`,
    "",
  ].join("\0"),
  "",
);

const MARKER_TREE: Record<string, [string, "file" | "dir"][]> = {
  "": [
    ["daily", "dir"],
    ["people", "dir"],
    ["projects", "dir"],
  ],
  daily: [
    ["2026-10-01.md", "file"],
    ["2026-10-02.md", "file"],
  ],
  people: [["linh.md", "file"]],
  projects: [
    ["garden-app.md", "file"],
    ["ideas", "dir"],
    ["so-roadmap.md", "file"],
  ],
  "projects/ideas": [
    ["ideas.md", "file"],
    ["kanban.md", "file"],
  ],
};

/**
 * The marker tree with every folder open, `projects/so-roadmap.md` unsaved
 * in a window, and the explorer focused on `people/linh.md`.
 */
async function markerTree(o: MountOptions): Promise<Mounted> {
  const x = await inRepo({ ...o, explorer: true });
  for (const [dir, entries] of Object.entries(MARKER_TREE))
    x.store.dispatch({
      type: "dirListed",
      dir,
      entries: entries.map(([name, kind]) => ({ name, kind })),
    });
  x.store.dispatch({
    type: "gitStatus",
    result: { ok: true, status: MARKER_STATUS },
  });
  x.open("projects/so-roadmap.md", "# Roadmap\n");
  x.keys("Ax<Esc><leader>e");
  const select = (path: string) => {
    // From the top row down; `k` past the top stays there.
    for (let i = 0; i < 40; i++) x.keys("k");
    for (let i = 0; x.store.get().panels.explorer.cursor !== path; i++) {
      if (i > 40) throw new Error(`no row ${path}`);
      x.keys("j");
    }
  };
  for (const dir of ["daily", "people", "projects", "projects/ideas"]) {
    select(dir);
    if (!x.store.get().panels.explorer.expanded.includes(dir)) x.keys("l");
  }
  select("people/linh.md");
  return x;
}

/** The explorer's rows: each tree row with its marker, without the frame. */
async function treeRows(x: Mounted): Promise<string[]> {
  return (await rowsOf(x))
    .map((r) => r.replace(/^[│ ]+|[│ ]+$/g, ""))
    .filter((r) => r !== "");
}

const rowEnding = (rows: readonly string[], end: string) =>
  rows.find((r) => r.split("│")[0]?.trimEnd().endsWith(end));

test("explorer rows show git markers after the name", async () => {
  m = await markerTree({ cols: 120, rows: 36 });
  let rows = await treeRows(m);
  for (const end of [
    "2026-10-02.md S",
    "so-roadmap.md ● M",
    "ideas.md ?",
    "kanban.md ?",
    "linh.md U",
    "daily •",
    "people •",
    "projects •",
    "ideas •",
  ])
    expect(rowEnding(rows, end)).toBeDefined();
  for (const plain of ["2026-10-01.md", "garden-app.md"])
    expect(rowEnding(rows, plain)).toBeDefined();
  expect(rows.join("\n")).not.toContain("2026-10-03.md");
  expect(rows.some((r) => r.split("│")[0]?.trimEnd().endsWith(" D"))).toBe(
    false,
  );

  // The selected row paints its marker in the row's own style.
  const frame = (await rowsOf(m)).map((r) => [...r]);
  const spans = m.t.captureSpans().lines;
  const cellOf = (text: string) => {
    const y = frame.findIndex((r) => r.join("").includes(text));
    return { x: (frame[y] ?? []).join("").indexOf(text) + text.length - 1, y };
  };
  const u = cellOf("linh.md U");
  expect(cellStyle(spans, u.x, u.y)).toEqual(
    styleOf(themes.dark, "treeSelFocus"),
  );
  const mod = cellOf("so-roadmap.md ● M");
  expect(cellStyle(spans, mod.x, mod.y)).toEqual(
    styleOf(themes.dark, "explorerGitModified"),
  );
  const s = cellOf("2026-10-02.md S");
  expect(cellStyle(spans, s.x, s.y)).toEqual(
    styleOf(themes.dark, "explorerGitStaged"),
  );

  // A collapsed new folder shows only its own mark.
  m.keys("k");
  for (
    let i = 0;
    m.store.get().panels.explorer.cursor !== "projects/ideas";
    i++
  ) {
    if (i > 40) throw new Error("no ideas row");
    m.keys("j");
  }
  m.keys("h");
  rows = await treeRows(m);
  expect(rowEnding(rows, "ideas •")).toBeDefined();
  expect(rows.join("\n")).not.toContain("ideas.md");
});

test("the floating explorer shows the same markers, also without colour", async () => {
  for (const o of [
    { cols: 80, rows: 24 },
    { cols: 120, rows: 36, config: NO_COLOR_CONFIG },
  ]) {
    m?.destroy();
    m = await markerTree(o);
    const rows = await treeRows(m);
    for (const end of [
      "2026-10-02.md S",
      "so-roadmap.md ● M",
      "ideas.md ?",
      "linh.md U",
      "daily •",
    ])
      expect(rowEnding(rows, end)).toBeDefined();
  }
});

test("outside a repository the explorer and statusline show no git state", async () => {
  m = await mountShell({ cols: 120, rows: 36 });
  m.store.dispatch({
    type: "gitStatus",
    result: { ok: true, status: MARKER_STATUS },
  });
  m.open("notes/plan.md", textOf(COUNT_BUFFER));
  const frame = await m.frame();
  expect(frame).not.toContain("⎇");
  expect(frame).not.toMatch(/ [MSU?•]\s*│/);
});

test("warnings and errors use their own message styles", async () => {
  for (const [color, theme] of [
    ["auto", themes.dark],
    ["never", themes.nocolor],
  ] as const) {
    m?.destroy();
    m = await inRepo({
      cols: 120,
      rows: 36,
      config: colorConfig(color),
    });
    const x = m;
    /** The message's text and the style of its first cell. */
    const messageRow = async () => {
      const text = await x.message();
      const { cols, rows } = x.store.get().terminal;
      const first = cols - [...text].length - 1;
      return {
        text,
        style: cellStyle(x.t.captureSpans().lines, first, rows - 2),
      };
    };
    x.store.dispatch({
      type: "gitStaged",
      path: "notes/plan.md",
      result: "stale",
      report: { n: 1, m: 1, saved: false },
    });
    const warn = await messageRow();
    expect(warn).toEqual({
      text: "index changed; hunks refreshed",
      style: styleOf(theme, "messageWarn"),
    });

    x.open("notes/plan.md", textOf(COUNT_BUFFER));
    x.store.dispatch({
      type: "gitIndexRead",
      path: "notes/plan.md",
      entry: tracked(textOf(COUNT_INDEX), true),
    });
    x.keys("2G<leader>ghs");
    const error = await messageRow();
    expect(error).toEqual({
      text: "notes/plan.md has conflicts; resolve them in lazygit",
      style: styleOf(theme, "messageError"),
    });
    expect({ color, warn, error }).toMatchSnapshot();
  }
  expect(styleOf(themes.nocolor, "messageError").attrs).toBe(
    TextAttributes.BOLD,
  );
});

/**
 * Forty buffer lines with four hunks: an added line 5, a changed line 10,
 * line 31 replacing three index lines, and an index line removed after
 * line 35.
 */
const FLOAT_BUFFER = Array.from({ length: 40 }, (_, i) => `b${i + 1}`);
const FLOAT_INDEX = FLOAT_BUFFER.flatMap((l, i) =>
  i === 4
    ? []
    : i === 9
      ? ["old10"]
      : i === 30
        ? ["Signs should be quiet.", "They must not distract.", "Prose first."]
        : i === 34
          ? [l, "gone"]
          : [l],
);

/** The open float's rows, from its top border to its bottom border. */
async function floatOf(x: Mounted) {
  const rows = await rowsOf(x);
  const top = rows.findIndex((r) => r.includes("╭─ hunk preview "));
  const bottom = rows.findIndex((r, y) => y > top && r.includes("╰─"));
  const left = [...(rows[top] ?? "")].indexOf("╭");
  const right = [...(rows[top] ?? "")].indexOf("╮");
  return {
    rows,
    top,
    bottom,
    left,
    right,
    inner: rows.slice(top + 1, bottom).map((r) =>
      [...r]
        .slice(left + 1, right)
        .join("")
        .trimEnd(),
    ),
  };
}

const cursorRow = (x: Mounted) => {
  const c = x.t.renderer.getCursorState();
  return c.y - 1;
};

test("the hunk float lays out header, removed and added lines, and caps long hunks", async () => {
  m = await inRepo({ cols: 120, rows: 36 });
  openWithIndex(m, "notes/plan.md", textOf(FLOAT_BUFFER), textOf(FLOAT_INDEX));
  m.keys("31G<leader>ghp");
  expect(m.store.get().overlay.kind).toBe("gitHunk");
  let f = await floatOf(m);
  expect(f.inner).toEqual([
    " ≃ changed + deleted · line 31 · hunk 3/4",
    " - Signs should be quiet.",
    " - They must not distract.",
    " - Prose first.",
    " + b31",
  ]);
  expect(f.rows[f.bottom]).toContain("╰─ esc / q close ─");
  const spans = m.t.captureSpans().lines;
  for (const y of [f.top + 2, f.top + 3, f.top + 4])
    expect(cellStyle(spans, f.left + 2, y)).toEqual(
      styleOf(themes.dark, "diffDel"),
    );
  expect(cellStyle(spans, f.left + 2, f.top + 5)).toEqual(
    styleOf(themes.dark, "diffAdd"),
  );
  expect(cellStyle(spans, f.left + 2, f.top + 1)).toEqual(
    styleOf(themes.dark, "floatDim"),
  );
  // Line 31 has no room below in 36 rows: the float sits right above it.
  expect(f.bottom).toBe(cursorRow(m) - 1);

  m.keys("<Esc>10G<leader>ghp");
  f = await floatOf(m);
  expect(f.inner).toEqual([
    " ~ changed · line 10 · hunk 2/4",
    " - old10",
    " + b10",
  ]);
  // Below the cursor row, from the text column, at most 72 cells wide.
  expect(f.top).toBe(cursorRow(m) + 1);
  expect(f.left).toBe(7);
  expect(f.right - f.left + 1).toBe(72);

  m.keys("<Esc>35G<leader>ghp");
  f = await floatOf(m);
  expect(f.inner).toEqual([
    " _ deleted below · after line 35 · hunk 4/4",
    " - gone",
  ]);
  expect(f.bottom).toBe(cursorRow(m) - 1);
});

for (const [cols, rows, cap] of [
  [120, 36, 12],
  [80, 24, 8],
] as const)
  test(`a long hunk shows ${cap} lines at ${cols}×${rows}`, async () => {
    const base = ["# Long", "", "end"];
    const added = Array.from({ length: 22 }, (_, i) => `added ${i + 1}`);
    m = await inRepo({ cols, rows });
    openWithIndex(
      m,
      "notes/plan.md",
      textOf([...base.slice(0, 2), ...added, ...base.slice(2)]),
      textOf(base),
    );
    m.keys("3G<leader>ghp");
    const f = await floatOf(m);
    expect(f.inner).toEqual([
      " + added · lines 3–24 · hunk 1/1",
      ...added.slice(0, cap).map((l) => ` + ${l}`),
      `   … ${22 - cap} more lines (0 removed, 22 added)`,
    ]);
    // Inside the editor area: below the bufferline, above the statusline.
    expect(f.top).toBeGreaterThanOrEqual(1);
    expect(f.bottom).toBeLessThanOrEqual(rows - 2);
    expect(f.top > cursorRow(m) || f.bottom < cursorRow(m)).toBe(true);
    if (cols === 80) expect(f.right).toBe(cols - 1);
    else expect(f.right - f.left + 1).toBe(72);
  });

test("the hunk float closes on escape, q, outside clicks, and other keys", async () => {
  m = await inRepo({ cols: 120, rows: 36 });
  const x = m;
  openWithIndex(x, "notes/plan.md", textOf(FLOAT_BUFFER), textOf(FLOAT_INDEX));
  const cursor = () => {
    const s = x.store.get();
    return s.windows.byId[s.windows.active]?.content.cursor;
  };
  const open = async () => {
    x.keys("<leader>ghp");
    expect(x.store.get().overlay.kind).toBe("gitHunk");
    return floatOf(x);
  };
  x.keys("10G");
  const at = cursor();
  for (const key of ["<Esc>", "q"]) {
    await open();
    x.keys(key);
    expect(x.store.get().overlay.kind).toBe("none");
    expect(cursor()).toEqual(at);
  }
  let f = await open();
  await x.mouse.click(f.left + 3, f.top + 1);
  expect(x.store.get().overlay.kind).toBe("gitHunk");
  await x.mouse.click(f.right + 5, f.bottom + 2);
  expect(x.store.get().overlay.kind).toBe("none");
  expect(cursor()).toEqual(at);

  f = await open();
  x.keys("j");
  expect(x.store.get().overlay.kind).toBe("none");
  expect(cursor()).toEqual({ line: 10, col: 0 });
  expect((await rowsOf(x)).join("\n")).not.toContain("hunk preview");

  x.keys("<leader>ghp");
  expect(x.store.get().overlay.kind).toBe("none");
  expect(await x.message()).toBe("no hunk at cursor");
});

/** The roadmap's index lines, and the buffer whose four hunks count +2 ~2 -3. */
const ROADMAP_INDEX = [
  "# Roadmap",
  "alpha",
  "beta",
  "gamma",
  "delta",
  "eps",
  "x1",
  "x2",
  "x3",
  "end",
];
const ROADMAP = [
  "# Roadmap",
  "alpha!",
  "beta",
  "new one",
  "new two",
  "gamma",
  "delta!",
  "eps",
  "end",
];
const ROADMAP_PATH = "projects/so-roadmap.md";

/**
 * A git adapter for the mounted shell: it answers the recorded index reads,
 * status reads, and stages from its own HEAD and index text. Each stage
 * makes the next of `staged` the index.
 */
function fakeGit(x: Mounted, staged: string[][]) {
  const head = textOf(ROADMAP_INDEX);
  let index = head;
  let seen = 0;
  const status = () => {
    const xy = `${index === head ? "." : "M"}${index === textOf(ROADMAP) ? "." : "M"}`;
    const records = [
      "# branch.oid 0123456789abcdef0123456789abcdef01234567",
      "# branch.head main",
    ];
    if (xy !== "..")
      records.push(
        `1 ${xy} N... 100644 100644 100644 ${"1".repeat(40)} ${"2".repeat(40)} ${ROADMAP_PATH}`,
      );
    return parseStatus(`${records.join("\0")}\0`, "");
  };
  const answer = (e: Effect) => {
    if (e.kind === "gitReadIndex")
      x.store.dispatch({
        type: "gitIndexRead",
        path: e.path,
        entry: tracked(index),
      });
    if (e.kind === "gitStatus")
      x.store.dispatch({
        type: "gitStatus",
        result: { ok: true, status: status() },
      });
    if (e.kind === "gitStage") {
      index = textOf(staged.shift() ?? []);
      x.store.dispatch({
        type: "gitStaged",
        path: e.path,
        result: "ok",
        report: e.report,
      });
    }
  };
  /** Answer every effect recorded since the last call, and the refresh timer. */
  const settleGit = () => {
    for (let round = 0; round < 5; round++) {
      while (seen < x.effects.length) {
        const e = x.effects[seen++];
        if (e !== undefined) answer(e);
      }
      x.advance(200);
    }
  };
  return { settleGit };
}

test("staging updates gutter, statusline, and explorer together", async () => {
  m = await inRepo({ cols: 120, rows: 36, explorer: true });
  const x = m;
  x.store.dispatch({
    type: "dirListed",
    dir: "",
    entries: [{ name: "projects", kind: "dir" }],
  });
  x.store.dispatch({
    type: "dirListed",
    dir: "projects",
    entries: [{ name: "so-roadmap.md", kind: "file" }],
  });
  x.keys("kl");
  const withNew = [
    ...ROADMAP_INDEX.slice(0, 3),
    "new one",
    "new two",
    ...ROADMAP_INDEX.slice(3),
  ];
  const git = fakeGit(x, [
    withNew,
    withNew.map((l) => (l === "alpha" ? "alpha!" : l)),
    withNew.map((l) =>
      l === "alpha" ? "alpha!" : l === "delta" ? "delta!" : l,
    ),
    ROADMAP,
  ]);
  x.open(ROADMAP_PATH, textOf(ROADMAP));
  git.settleGit();
  /** The change column per buffer line, the git segment, the roadmap's tree row, and the message. */
  const surfaces = async () => {
    const rows = await rowsOf(x);
    const left = [...(rows[1] ?? "")].indexOf("│") + 1;
    return {
      signs: rows
        .slice(1, 1 + ROADMAP.length)
        .map((r) => [...r][left] ?? " ")
        .join(""),
      status: rows[35]?.match(/⎇.*?(?= {2}|$)/)?.[0],
      explorer: rows
        .slice(2)
        .find((r) => r.includes("so-roadmap.md"))
        ?.split("│")[0]
        ?.trim(),
      message: await x.message(),
    };
  };
  expect(await surfaces()).toEqual({
    signs: " ~ ++ ~_ ",
    status: "⎇ main +2 ~2 -3",
    explorer: expect.stringMatching(/so-roadmap\.md M$/),
    message: "",
  });

  x.keys("4G<leader>ghs");
  git.settleGit();
  expect(await surfaces()).toEqual({
    signs: " ~    ~_ ",
    status: "⎇ main ~2 -3",
    explorer: expect.stringMatching(/so-roadmap\.md M$/),
    message: "staged hunk 2/4",
  });

  for (const line of [2, 7, 8]) {
    x.keys(`${line}G<leader>ghs`);
    git.settleGit();
  }
  expect(await surfaces()).toEqual({
    signs: "         ",
    status: "⎇ main",
    explorer: expect.stringMatching(/so-roadmap\.md S$/),
    message: "staged hunk 1/1",
  });
});

test("the hand-off paints the saved message once and restores the screen", async () => {
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    m = await inRepo({
      cols: 100,
      rows: 40,
      capabilities: KITTY,
      files: { "images/diagram.png": PNG },
    });
    const x = m;
    x.store.dispatch({
      type: "indexBatch",
      summaries: [],
      files: [ROADMAP_PATH, "images/diagram.png"],
      done: 0,
      total: 0,
    });
    x.open(ROADMAP_PATH, "# Roadmap\n\n![[diagram.png]]\n\nText\n");
    await x.frame();
    await Bun.sleep(0);
    x.keys("GoNext step<Esc><leader>gg");
    x.store.dispatch({ type: "saved", path: ROADMAP_PATH, stamp: stamp(2) });
    const run = x.effects.filter((e) => e.kind === "runTool");
    expect(run).toHaveLength(1);
    const frames = x.record();
    const tool = { framesBefore: -1, framesDuring: -1, drawsDuring: -1 };
    const host = createToolHost({
      screen: x.shell,
      holdInterrupts: () => () => {},
      which: (c) => `/usr/bin/${c}`,
      logger: { info: () => {}, error: () => {} },
      spawn: async () => {
        tool.framesBefore = frames.recordedFrames.length;
        draw.mockClear();
        // The editor changes while the tool runs; nothing may paint.
        x.store.dispatch({ type: "resize", cols: 100, rows: 40 });
        await settle();
        tool.framesDuring = frames.recordedFrames.length - tool.framesBefore;
        tool.drawsDuring = draw.mock.calls.length;
        return { code: 0 };
      },
    });
    const e = run[0];
    if (e?.kind !== "runTool") throw new Error("expected runTool");
    // The runner dispatches the result as soon as the run ends.
    x.store.dispatch({
      type: "toolExited",
      result: await host.run(e.argv, e.cwd),
    });
    await settle();
    frames.stop();
    const list = frames.recordedFrames.map((f) => f.frame.split("\n"));
    const pre = list[tool.framesBefore - 1];
    const post = list[tool.framesBefore];
    const messageRow = 38;
    expect(pre?.[messageRow]?.trimEnd()).toEndWith(
      `"${ROADMAP_PATH}" written · opening lazygit`,
    );
    expect(tool).toMatchObject({ framesDuring: 0, drawsDuring: 0 });
    expect(post?.[messageRow]).not.toContain("written");
    expect(post?.slice(0, messageRow)).toEqual(pre?.slice(0, messageRow));
    expect(post?.[messageRow + 1]).toEqual(pre?.[messageRow + 1]);
    expect(draw).toHaveBeenCalled();
  } finally {
    draw.mockRestore();
  }
});
