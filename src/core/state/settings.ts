import { type AppConfig, ConfigSchema, THEME_NAMES } from "../config/schema";
import type { SettingValue } from "../config/toml-edit";
import { rankBy } from "../kernel/text/fuzzy";
import { movedCaret, relistShown, resizeExplorer, typed } from "./explorer";
import { chain, message, none, toast } from "./result";
import type {
  Action,
  AppState,
  PickerItem,
  PickerState,
  PromptState,
  Result,
} from "./types";

type SettingPath = readonly [string] | readonly [string, string];

/**
 * A setting the settings picker changes: its config path and what it does.
 * Enter cycles a `choice` setting and opens a prompt for a `number` or `text`
 * one, checked against the config schema.
 */
type Setting = {
  path: SettingPath;
  /** Short lines for the preview pane, which does not wrap. */
  about: readonly string[];
} & (
  | { kind: "choice"; choices: readonly SettingValue[] }
  | { kind: "number" | "text" }
);
type TypedSetting = Extract<Setting, { kind: "number" | "text" }>;

/** Settings that apply while `so` runs. */
export const SETTINGS: readonly Setting[] = [
  {
    kind: "choice",
    path: ["explorer", "position"],
    choices: ["left", "right"],
    about: [
      "The edge the explorer docks on;",
      "the side panel takes the other.",
    ],
  },
  {
    kind: "choice",
    path: ["explorer", "icons"],
    choices: ["nerd", "unicode"],
    about: ["Nerd Font file-type icons, or", "plain symbols for other fonts."],
  },
  {
    kind: "choice",
    path: ["explorer", "dotfiles"],
    choices: [false, true],
    about: [
      "List dot entries other than",
      "`.git` in the explorer; search",
      "still skips them.",
    ],
  },
  {
    kind: "choice",
    path: ["explorer", "gitignored"],
    choices: [true, false],
    about: [
      "List names a `.gitignore`",
      "matches, dimmed, in the",
      "explorer; search still skips",
      "them.",
    ],
  },
  {
    kind: "choice",
    path: ["theme"],
    choices: THEME_NAMES,
    about: [
      "The colour theme: `dark`/`light`",
      "are Tokyo Night; `paper` and",
      "`sepia` are warm, for reading.",
    ],
  },
  {
    kind: "choice",
    path: ["color"],
    choices: ["auto", "never"],
    about: ["`never` draws without colour,", "as NO_COLOR does."],
  },
  {
    kind: "choice",
    path: ["mouse"],
    choices: [true, false],
    about: ["Terminal mouse reporting:", "clicks, drags, and the wheel."],
  },
  {
    kind: "choice",
    path: ["editor", "wrap"],
    choices: [true, false],
    about: ["Wrap long lines at the", "window edge."],
  },
  {
    kind: "choice",
    path: ["editor", "relativeNumbers"],
    choices: [true, false],
    about: ["Line numbers relative to the", "cursor line."],
  },
  {
    kind: "choice",
    path: ["preview", "mode"],
    choices: ["reading", "live", "source"],
    about: ["The view a note opens in;", "open notes keep theirs."],
  },
  {
    kind: "choice",
    path: ["preview", "images"],
    choices: ["auto", "blocks", "off"],
    about: [
      "Terminal graphics when the",
      "terminal can, coloured blocks,",
      "or no images.",
    ],
  },
  {
    kind: "choice",
    path: ["preview", "justify"],
    choices: [false, true],
    about: [
      "Spread wrapped prose rows to",
      "both edges in the reading and",
      "live views.",
    ],
  },
  {
    kind: "choice",
    path: ["autosave", "enabled"],
    choices: [true, false],
    about: ["Save a changed note after a", "pause in typing."],
  },
  {
    kind: "number",
    path: ["autosave", "delayMs"],
    about: ["Milliseconds of no typing", "before a changed note saves."],
  },
  {
    kind: "number",
    path: ["editor", "tabWidth"],
    about: ["Columns a tab character", "takes, 1–16."],
  },
  {
    kind: "number",
    path: ["editor", "keyTimeout"],
    about: [
      "Milliseconds an Insert-mode",
      "binding's first keys wait for",
      "the rest, 50–10000.",
    ],
  },
  {
    kind: "number",
    path: ["explorer", "width"],
    about: ["The tree's columns, 15–200;", "replaces a resized width."],
  },
  {
    kind: "number",
    path: ["preview", "embedMaxRows"],
    about: ["Rows an embedded note shows", "in a preview, 1–200."],
  },
  {
    kind: "number",
    path: ["preview", "readableWidth"],
    about: [
      "Text columns a note shows,",
      "centered; 0 fills the window,",
      "up to 500.",
    ],
  },
  {
    kind: "number",
    path: ["escTimeoutMs"],
    about: [
      "Milliseconds the terminal's",
      "Esc waits to tell itself from",
      "a key sequence.",
    ],
  },
  {
    kind: "text",
    path: ["daily", "folder"],
    about: ["The workspace folder daily", "notes go in."],
  },
  {
    kind: "text",
    path: ["daily", "format"],
    about: ["A daily note's file name, in", "Moment tokens."],
  },
  {
    kind: "text",
    path: ["daily", "template"],
    about: ["The template a new daily note", "starts from."],
  },
  {
    kind: "text",
    path: ["templates", "folder"],
    about: ["The workspace folder the", "template picker lists."],
  },
];

const keyOf = (path: readonly string[]) => path.join(".");
const settingOf = (key: string) => SETTINGS.find((x) => keyOf(x.path) === key);
const shown = (v: SettingValue) =>
  v === true ? "on" : v === false ? "off" : String(v);

function currentValue(config: AppConfig, path: SettingPath): SettingValue {
  const [a, b] = path;
  const top = (config as unknown as Record<string, unknown>)[a];
  const v =
    b === undefined ? top : (top as Record<string, unknown> | undefined)?.[b];
  return v as SettingValue;
}

function withValue(
  config: AppConfig,
  path: SettingPath,
  value: SettingValue,
): AppConfig {
  const [a, b] = path;
  const c = config as unknown as Record<string, unknown>;
  const next =
    b === undefined
      ? { ...c, [a]: value }
      : { ...c, [a]: { ...(c[a] as object), [b]: value } };
  return next as unknown as AppConfig;
}

/** The settings rows for `query`: each setting's key and current value. */
export function settingItems(s: AppState, query: string): PickerItem[] {
  return rankBy(SETTINGS, query, (x) => keyOf(x.path)).map(
    ({ item, match }) => ({
      key: keyOf(item.path),
      label: keyOf(item.path),
      detail: shown(currentValue(s.config, item.path)),
      matches: match.positions,
    }),
  );
}

/** The preview pane: what the setting does, its choices, and where it is saved. */
export function describeSetting(s: AppState, item: PickerItem) {
  const x = settingOf(item.key);
  if (x === undefined) return [];
  const now = currentValue(s.config, x.path);
  const head = [
    { text: item.key, style: "floatTitle" },
    { text: "" },
    ...x.about.map((text) => ({ text })),
    { text: "" },
  ];
  if (x.kind !== "choice")
    return [
      ...head,
      { text: shown(now), style: "floatTitle" },
      { text: "" },
      {
        text: `Enter: type a ${x.kind === "number" ? "number" : "value"}`,
        style: "floatDim",
      },
      { text: "Saved to config.toml", style: "floatDim" },
    ];
  return [
    ...head,
    ...choiceLines(x.choices, now),
    { text: "" },
    {
      text:
        item.key === "theme" ? "Enter: choose a theme" : "Enter: next choice",
      style: "floatDim",
    },
    { text: "Saved to config.toml", style: "floatDim" },
  ];
}

/** Columns a line of choices fills before the next choice wraps. */
const CHOICE_WIDTH = 32;

/** The choices joined by ` · `, wrapped between choices, with the current one marked. */
function choiceLines(choices: readonly SettingValue[], now: SettingValue) {
  const lines: {
    text: string;
    ranges: { from: number; to: number; style: string }[];
  }[] = [];
  for (const c of choices) {
    const name = shown(c);
    let line = lines.at(-1);
    if (
      line !== undefined &&
      [...`${line.text} · ${name}`].length <= CHOICE_WIDTH
    )
      line.text += " · ";
    else {
      line = { text: "", ranges: [] };
      lines.push(line);
    }
    const from = [...line.text].length;
    line.text += name;
    if (c === now)
      line.ranges.push({
        from,
        to: from + [...name].length,
        style: "floatTitle",
      });
  }
  return lines;
}

/** Settings that change which entries the explorer lists. */
const LISTING = ["explorer.dotfiles", "explorer.gitignored"];

/**
 * Work a new value needs beyond repainting: the explorer lists its folders
 * again, or drops a resized width so `explorer.width` shows.
 */
function applySetting(s: AppState, path: SettingPath): Result {
  const key = keyOf(path);
  if (LISTING.includes(key)) return relistShown(s);
  return none(key === "explorer.width" ? resizeExplorer(s, undefined) : s);
}

/** `value` applies now and is written to config.toml. */
function setSetting(
  s: AppState,
  path: SettingPath,
  value: SettingValue,
): Result {
  const previous = currentValue(s.config, path);
  const next = refreshSettings(
    { ...s, config: withValue(s.config, path, value) },
    keyOf(path),
  );
  return chain(
    {
      state: next,
      effects: [{ kind: "writeSetting", path: [...path], value, previous }],
    },
    (st) => applySetting(st, path),
  );
}

/**
 * Enter: a choice setting's next choice applies now and is written to
 * config.toml, and the picker stays open; `theme` opens the theme list; a
 * number or text setting opens a prompt holding its value.
 */
export function changeSetting(s: AppState, item: PickerItem): Result {
  const x = settingOf(item.key);
  if (x === undefined) return { state: s, effects: [] };
  const previous = currentValue(s.config, x.path);
  if (item.key === "theme") return openThemes(s);
  if (x.kind !== "choice") {
    if (s.overlay.kind !== "picker") return none(s);
    const prompt: PromptState = {
      kind: "input",
      title: item.key,
      value: shown(previous),
      setting: { path: [...x.path], picker: s.overlay.picker },
    };
    return none({ ...s, overlay: { kind: "prompt", prompt } });
  }
  const at = x.choices.indexOf(previous);
  const value = x.choices[(at + 1) % x.choices.length] ?? previous;
  return setSetting(s, x.path, value);
}

/** The theme list for `query`, the theme in use marked. */
export function themeItems(s: AppState, query: string): PickerItem[] {
  return rankBy(THEME_NAMES, query, (name) => name).map(({ item, match }) => ({
    key: item,
    label: item,
    matches: match.positions,
    ...(item === s.config.theme ? { detail: "current" } : {}),
  }));
}

/** Enter on `theme`: a list of the themes to filter, with the one in use selected. */
function openThemes(s: AppState): Result {
  if (s.overlay.kind !== "picker") return none(s);
  const items = themeItems(s, "");
  const picker: PickerState = {
    source: "themes",
    query: "",
    items,
    total: items.length,
    selected: Math.max(0, THEME_NAMES.indexOf(s.config.theme)),
    back: s.overlay.picker,
  };
  return none({ ...s, overlay: { kind: "picker", picker } });
}

/** Enter in the theme list: the theme applies, is saved, and the settings come back. */
export function chooseTheme(s: AppState, item: PickerItem): Result {
  const p = s.overlay.kind === "picker" ? s.overlay.picker : undefined;
  const back: AppState =
    p?.back === undefined
      ? { ...s, overlay: { kind: "none" } }
      : { ...s, overlay: { kind: "picker", picker: p.back } };
  const theme = THEME_NAMES.find((name) => name === item.key);
  if (theme === undefined || theme === s.config.theme) return none(back);
  return setSetting(back, ["theme"], theme);
}

/** The theme list's preview: sample text in the selected theme, which the screen shows meanwhile. */
export function describeTheme(_s: AppState, item: PickerItem) {
  const sample = (parts: [string, string][]) => {
    let from = 0;
    const ranges = parts.map(([text, style]) => {
      const r = { from, to: from + [...text].length, style };
      from = r.to;
      return r;
    });
    return { text: parts.map(([text]) => text).join(""), ranges };
  };
  return [
    { text: item.key, style: "floatTitle" },
    { text: "" },
    sample([["# On Reading Slowly", "mdHeading1"]]),
    { text: "" },
    sample([
      ["A book read ", "float"],
      ["slowly", "mdBold"],
      [" is read ", "float"],
      ["twice", "mdItalic"],
      [".", "float"],
    ]),
    sample([
      ["See ", "float"],
      ["The Library", "mdLink"],
      [" and ", "float"],
      ["#reading", "mdTag"],
      [".", "float"],
    ]),
    sample([
      ["Keep a ", "float"],
      ["pencil", "mdHighlight"],
      [" and ", "float"],
      ["`notes`", "mdCode"],
      [".", "float"],
    ]),
    sample([["> Read in order to live.", "mdQuote"]]),
    { text: "" },
    { text: "Enter: apply · Esc: back", style: "floatDim" },
    { text: "Saved to config.toml", style: "floatDim" },
  ];
}

/** `H` in the explorer: show or hide dot entries, saved like the setting. */
export function toggleDotfiles(s: AppState): Result {
  const shown = !s.config.explorer.dotfiles;
  return chain(setSetting(s, ["explorer", "dotfiles"], shown), (st) =>
    message(st, shown ? "dot entries shown" : "dot entries hidden"),
  );
}

/** `I` in the explorer: show or hide gitignored entries, saved like the setting. */
export function toggleGitignored(s: AppState): Result {
  const shown = !s.config.explorer.gitignored;
  return chain(setSetting(s, ["explorer", "gitignored"], shown), (st) =>
    message(
      st,
      shown ? "gitignored entries shown" : "gitignored entries hidden",
    ),
  );
}

/** A setting could not be saved: it returns to `previous`, and a toast says why. */
export function onSettingFailed(
  s: AppState,
  a: Extract<Action, { type: "settingFailed" }>,
): Result {
  const x = settingOf(keyOf(a.path));
  const reverted =
    x === undefined
      ? none(s)
      : applySetting(
          refreshSettings(
            { ...s, config: withValue(s.config, x.path, a.previous) },
            keyOf(x.path),
          ),
          x.path,
        );
  return chain(reverted, (st) =>
    toast(st, "error", `Setting not saved: ${a.reason}`),
  );
}

/** Re-list an open settings picker, keeping `key` selected. */
function refreshSettings(s: AppState, key: string): AppState {
  if (s.overlay.kind !== "picker" || s.overlay.picker.source !== "settings")
    return s;
  const p = s.overlay.picker;
  const items = settingItems(s, p.query);
  const selected = Math.max(
    0,
    items.findIndex((i) => i.key === key),
  );
  return { ...s, overlay: { ...s.overlay, picker: { ...p, items, selected } } };
}

type SettingPrompt = Extract<PromptState, { setting: object }>;

/**
 * `text` as a value for `x`, checked by the config schema alone: the value
 * the config would hold (a path normalized), or why it cannot be saved.
 */
export function parseSettingValue(
  x: TypedSetting,
  text: string,
): { value: SettingValue } | { invalid: string } {
  const raw = text.trim();
  if (x.kind === "number" && !/^\d+$/.test(raw))
    return { invalid: "must be a whole number" };
  const value = x.kind === "number" ? Number(raw) : raw;
  const [a, b] = x.path;
  const parsed = ConfigSchema.safeParse(
    b === undefined ? { [a]: value } : { [a]: { [b]: value } },
  );
  if (!parsed.success)
    return { invalid: parsed.error.issues[0]?.message ?? "invalid value" };
  return { value: currentValue(parsed.data, x.path) };
}

/** Back to the settings picker the prompt came from, its rows showing current values. */
const backToPicker = (s: AppState, picker: PickerState, key: string) =>
  refreshSettings({ ...s, overlay: { kind: "picker", picker } }, key);

/**
 * Keys in a setting's prompt: typing edits the value and says why it cannot
 * be saved; Enter applies and saves a valid one; Esc goes back unchanged.
 */
export function settingPromptKey(
  s: AppState,
  p: SettingPrompt,
  key: string,
): Result {
  const x = settingOf(keyOf(p.setting.path));
  if (x === undefined || x.kind === "choice")
    return none({ ...s, overlay: { kind: "none" } });
  if (key === "<Esc>") return none(backToPicker(s, p.setting.picker, p.title));
  if (key === "<CR>") {
    if (p.invalid !== undefined) return none(s);
    const r = parseSettingValue(x, p.value);
    if ("invalid" in r)
      return none({
        ...s,
        overlay: { kind: "prompt", prompt: { ...p, invalid: r.invalid } },
      });
    const back = backToPicker(s, p.setting.picker, p.title);
    return r.value === currentValue(s.config, x.path)
      ? none(back)
      : setSetting(back, x.path, r.value);
  }
  const f = typed(p, key);
  if (f === undefined) return none(s);
  if (f.value === p.value) return none(movedCaret(s, f.caret));
  const { invalid: _, ...rest } = p;
  const r = parseSettingValue(x, f.value);
  const prompt =
    "invalid" in r ? { ...rest, ...f, invalid: r.invalid } : { ...rest, ...f };
  return none({ ...s, overlay: { kind: "prompt", prompt } });
}
