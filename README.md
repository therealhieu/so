# so

A fast terminal editor with Vim keys, for Markdown notes and code. Notes get Obsidian-style links, views, and Bases; code files get language-server features.

![so: a file picker, a rendered note with a Mermaid diagram, a PDF highlight, a Bases table edit, and a Rust hover](docs/intro.gif)

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
- Language servers on `PATH` (e.g. `rust-analyzer`, `typescript-language-server`) — code intelligence
- [lazygit](https://github.com/jesseduffield/lazygit) — the `<leader>gg` handoff

## Configuration

Config lives at `~/.config/so/config.toml` (or `$XDG_CONFIG_HOME/so/config.toml`); `:Settings` changes common options in place.

## Development

To run from source, install [Bun](https://bun.sh) `1.4.2`.

```sh
bun install --frozen-lockfile
bun run dev [path]          # run from source
bun run sandbox             # try it on a demo vault with isolated config
bun run build               # compile to dist/so
```

Releases are manual: pushing a `v*` tag builds and smoke-tests the four binaries, publishes the GitHub release, then publishes to npm and the Homebrew tap.
