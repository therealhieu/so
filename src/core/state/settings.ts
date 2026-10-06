import type { AppConfig } from "../config/schema";
import type { SettingValue } from "../config/toml-edit";
import { rankBy } from "../kernel/text/fuzzy";
import { toast } from "./result";
import type { Action, AppState, PickerItem, Result } from "./types";

/** A setting the settings picker cycles: its config path, choices, and what it does. */
type Setting = {
  path: readonly [string] | readonly [string, string];
  choices: readonly SettingValue[];
  /** Short lines for the preview pane, which does not wrap. */
  about: readonly string[];
};

/** Settings with a fixed set of choices that apply while `so` runs. */
export const SETTINGS: readonly Setting[] = [
  {
    path: ["explorer", "position"],
    choices: ["left", "right"],
    about: [
      "The edge the explorer docks on;",
      "the side panel takes the other.",
    ],
  },
  {
    path: ["explorer", "icons"],
    choices: ["nerd", "unicode"],
    about: ["Nerd Font file-type icons, or", "plain symbols for other fonts."],
  },
  { path: ["theme"], choices: ["dark", "light"], about: ["The colour theme."] },
  {
    path: ["color"],
    choices: ["auto", "never"],
    about: ["`never` draws without colour,", "as NO_COLOR does."],
  },
  {
    path: ["mouse"],
    choices: [true, false],
    about: ["Terminal mouse reporting:", "clicks, drags, and the wheel."],
  },
  {
    path: ["editor", "wrap"],
    choices: [true, false],
    about: ["Wrap long lines at the", "window edge."],
  },
  {
    path: ["editor", "relativeNumbers"],
    choices: [true, false],
    about: ["Line numbers relative to the", "cursor line."],
  },
  {
    path: ["preview", "mode"],
    choices: ["reading", "live", "source"],
    about: ["The view a note opens in;", "open notes keep theirs."],
  },
  {
    path: ["preview", "images"],
    choices: ["auto", "blocks", "off"],
    about: [
      "Terminal graphics when the",
      "terminal can, coloured blocks,",
      "or no images.",
    ],
  },
  {
    path: ["autosave", "enabled"],
    choices: [true, false],
    about: ["Save a changed note after a", "pause in typing."],
  },
];

const keyOf = (path: readonly string[]) => path.join(".");
const settingOf = (key: string) => SETTINGS.find((x) => keyOf(x.path) === key);
const shown = (v: SettingValue) =>
  v === true ? "on" : v === false ? "off" : v;

function currentValue(config: AppConfig, path: Setting["path"]): SettingValue {
  const [a, b] = path;
  const top = (config as unknown as Record<string, unknown>)[a];
  const v =
    b === undefined ? top : (top as Record<string, unknown> | undefined)?.[b];
  return v as SettingValue;
}

function withValue(
  config: AppConfig,
  path: Setting["path"],
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
  return [
    { text: item.key, style: "floatTitle" },
    { text: "" },
    ...x.about.map((text) => ({ text })),
    { text: "" },
    {
      text: x.choices.map(shown).join(" · "),
      ranges: x.choices.flatMap((c, i) => {
        if (c !== now) return [];
        const from = [
          ...x.choices
            .slice(0, i)
            .map((v) => `${shown(v)} · `)
            .join(""),
        ].length;
        return [{ from, to: from + [...shown(c)].length, style: "floatTitle" }];
      }),
    },
    { text: "" },
    { text: "Enter: next choice", style: "floatDim" },
    { text: "Saved to config.toml", style: "floatDim" },
  ];
}

/** Enter: the setting's next choice applies now and is written to config.toml; the picker stays open. */
export function cycleSetting(s: AppState, item: PickerItem): Result {
  const x = settingOf(item.key);
  if (x === undefined) return { state: s, effects: [] };
  const previous = currentValue(s.config, x.path);
  const at = x.choices.indexOf(previous);
  const value = x.choices[(at + 1) % x.choices.length] ?? previous;
  return {
    state: refreshSettings(
      { ...s, config: withValue(s.config, x.path, value) },
      item.key,
    ),
    effects: [{ kind: "writeSetting", path: [...x.path], value, previous }],
  };
}

/** A setting could not be saved: it returns to `previous`, and a toast says why. */
export function onSettingFailed(
  s: AppState,
  a: Extract<Action, { type: "settingFailed" }>,
): Result {
  const x = settingOf(keyOf(a.path));
  const reverted =
    x === undefined
      ? s
      : refreshSettings(
          { ...s, config: withValue(s.config, x.path, a.previous) },
          keyOf(x.path),
        );
  return toast(reverted, "error", `Setting not saved: ${a.reason}`);
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
