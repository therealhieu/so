/** Which glyphs the tree draws: Nerd Font icons, or symbols every font has. */
export type IconSet = "nerd" | "unicode";

/** A tree row's leading glyph and the theme token it is drawn in. */
export type Icon = { glyph: string; token: string };

type Kind = {
  nerd: string;
  unicode: string;
  token: string;
};

const NOTE: Kind = { nerd: "", unicode: "◇", token: "iconNote" }; // nf-seti-markdown
const BASE: Kind = { nerd: "", unicode: "▦", token: "iconBase" }; // nf-fa-table
const IMAGE: Kind = { nerd: "", unicode: "◩", token: "iconImage" }; // nf-fa-file_image_o
const TEXT: Kind = { nerd: "", unicode: "≡", token: "iconText" }; // nf-fa-file_text
const FILE: Kind = { nerd: "", unicode: "≡", token: "iconText" }; // nf-fa-file
const BINARY: Kind = { nerd: "", unicode: "▫", token: "iconText" }; // nf-fa-file_archive_o
const code = (nerd: string, token = "iconCode"): Kind => ({
  nerd,
  unicode: "≡",
  token,
});
const CONFIG = (nerd: string): Kind => code(nerd, "iconConfig");

/** Lower-case file names that carry their own icon, checked before extensions. */
const BY_NAME: Readonly<Record<string, Kind>> = {
  makefile: CONFIG(""), // nf-seti-makefile
  dockerfile: CONFIG(""), // nf-linux-docker
  ".gitignore": CONFIG(""), // nf-dev-git
  ".gitattributes": CONFIG(""),
  license: TEXT,
};

/** Lower-case extensions, without the dot. */
const BY_EXTENSION: Readonly<Record<string, Kind>> = {
  md: NOTE,
  base: BASE,
  png: IMAGE,
  jpg: IMAGE,
  jpeg: IMAGE,
  gif: IMAGE,
  webp: IMAGE,
  bmp: IMAGE,
  svg: IMAGE,
  ico: IMAGE,
  txt: TEXT,
  log: TEXT,
  csv: code("", "iconData"), // nf-fa-file_excel_o
  json: code("", "iconData"), // nf-seti-json
  yaml: CONFIG(""), // nf-seti-yml
  yml: CONFIG(""),
  toml: CONFIG(""), // nf-seti-toml
  ts: code(""), // nf-seti-typescript
  tsx: code(""), // nf-dev-react
  js: code(""), // nf-dev-javascript
  jsx: code(""),
  py: code(""), // nf-seti-python
  rs: code(""), // nf-dev-rust
  go: code(""), // nf-seti-go
  sh: code(""), // nf-oct-terminal
  zsh: code(""),
  bash: code(""),
  html: code(""), // nf-dev-html5
  css: code(""), // nf-dev-css3
  lock: CONFIG(""), // nf-fa-lock
  pdf: code("", "iconData"), // nf-fa-file_pdf_o
  zip: BINARY,
  gz: BINARY,
  tar: BINARY,
};

/** The glyph and colour for a file at `path`, by its exact name, then its extension. */
export function fileIcon(path: string, set: IconSet): Icon {
  const name = (path.split("/").pop() ?? path).toLowerCase();
  const dot = name.lastIndexOf(".");
  const kind =
    BY_NAME[name] ??
    (dot > 0 ? BY_EXTENSION[name.slice(dot + 1)] : undefined) ??
    FILE;
  return { glyph: kind[set], token: kind.token };
}

/** The glyph for a folder row. */
export const folderIcon = (open: boolean, set: IconSet): string =>
  set === "nerd" ? (open ? "" : "") : open ? "▾" : "▸"; // nf-fa-folder_open, nf-fa-folder
