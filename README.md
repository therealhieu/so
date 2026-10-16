# so

A fast terminal editor with Vim keys, for Markdown notes and code. Notes get Obsidian-style links, views, and Bases; code files get language-server features.

![so: a rendered Obsidian note with callouts, a table, tasks, math, and Mermaid; a theme switch; a Bases table edit; a PDF highlight; a zoomed picture; a web page; a SQLite query; a Git hunk preview and a Rust hover](docs/intro.gif)

```sh
so [path]
```

## Features

- **Notes** — wiki links, backlinks, link-safe renames, pickers, and full-text search, backed by a background index so typing never blocks.
- **Three views** — read-only `reading`, Obsidian-style `live` (rendered blocks, source on the cursor line), and `source`; images, embeds, math, and Mermaid draw in the terminal.
- **Browser preview** — `:Preview` mirrors the active note on `127.0.0.1`.
- **Daily notes and templates** — Obsidian-compatible; never overwrite an existing file.
- **Bases** — Obsidian `.base` files open as table and Kanban views that write back to frontmatter.
- **PDFs** — read, search, and zoom PDFs in the terminal; select text with the mouse to copy, highlight, or add a note; list your highlights and notes (`<leader>pa`); embed a page in a note (`![[paper.pdf#page=3]]`). Needs [Poppler](https://poppler.freedesktop.org) (`brew install poppler`).
- **SQLite** — open a `.db`, `.sqlite`, `.sqlite3`, or `.db3` file to page through its tables and views, read a table's schema (`Tab`), see a whole value (`Enter`), and run read-only queries in a dialog (`s`) that checks them as you type and completes table and column names. Nothing is ever written to the database.
- **Images and SVG** — open a `.png`, `.jpg`, `.webp`, or `.gif` to see it fitted to the window; zoom with `+`/`-` or the wheel and pan with `hjkl` or a drag. An `.svg` opens drawn, and `<leader>m` flips it to its source.
- **Videos** — open an `.mp4`, `.mov`, `.webm`, `.mkv`, or `.avi` to see a still frame, its size, codecs, and length; move the frame with `h`/`l`, and play it in the system player with `Enter`. Needs [ffmpeg](https://ffmpeg.org) (`brew install ffmpeg`).
- **HTML pages** — open an `.html` file to see it as a browser shows it, drawn by headless Chrome in the terminal (over SSH too); click and scroll the page, type into it after `i` (`<C-\><C-n>` returns), and flip to its source with `<leader>m`. Needs Chrome or Chromium.
- **Git** — change column, blame, hunk stage/reset, and a lazygit handoff (`<leader>gg`).
- **Code intelligence** — language servers for diagnostics, hover, go-to, rename, code actions, formatting, and completion.
- **Mouse** — works on every surface, always running the same path as a keyboard action.

## Install

Runs on macOS and Linux, x64 and arm64. Every channel installs the same prebuilt binary, so you don't need Node or Bun to run it.

| Channel | Install | Upgrade |
|---|---|---|
| Homebrew | `brew install therealhieu/tap/so` | `brew upgrade therealhieu/tap/so` |
| Bun | `bun add -g @therealhieu/so` | `bun add -g @therealhieu/so@latest` |
| npm | `npm install -g @therealhieu/so` | `npm install -g @therealhieu/so@latest` |

Or download the binary for your platform (`so-darwin-arm64`, `so-darwin-x64`, `so-linux-x64`, `so-linux-arm64`) from the [latest release](https://github.com/therealhieu/so/releases/latest):

```sh
curl -fLo so https://github.com/therealhieu/so/releases/latest/download/so-darwin-arm64
chmod +x so && mv so ~/.local/bin/
```

The package names are scoped because `so` is already taken by unrelated tools: on npm by a coroutine library, and in Homebrew core by a StackOverflow client. The command you run is still `so`. If Homebrew core's `so` is installed, it collides with this one, so keep only one of them.

Optional tools turn on more features:

- [Poppler](https://poppler.freedesktop.org) (`brew install poppler`) — PDFs
- [ffmpeg](https://ffmpeg.org) (`brew install ffmpeg`), with `ffprobe` — videos
- Google Chrome or Chromium (found on `PATH` or in `/Applications`; `[browser] chrome` in config picks one) — HTML pages
- Language servers on `PATH` (e.g. `rust-analyzer`, `typescript-language-server`, `terraform-ls`) — code intelligence
- [lazygit](https://github.com/jesseduffield/lazygit) — the `<leader>gg` handoff

## Configuration

Config lives at `~/.config/so/config.toml` (or `$XDG_CONFIG_HOME/so/config.toml`); `:Settings` changes common options in place.

## Development

To run from source, install [Bun](https://bun.sh). CI uses `1.4.2` (pinned in `package.json`); other versions aren't tested.

```sh
bun install --frozen-lockfile
bun run dev [path]          # run from source
bun run sandbox             # try it on a demo vault with isolated config
bun run build               # compile to dist/so
```

Releases are manual: pushing a `v*` tag builds and smoke-tests the four binaries, publishes the GitHub release, then publishes to npm and the Homebrew tap.
