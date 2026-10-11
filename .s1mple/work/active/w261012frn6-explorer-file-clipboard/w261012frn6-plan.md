# Explorer copy, cut, and paste with the system file clipboard

## Context

The explorer can create, rename, move, and delete (`a r m d`, `src/core/kernel/commands/defaults.ts:44-47`), but cannot copy, cut, or paste, and the system clipboard adapter carries text only (`src/workspace/system.ts:2-6`). The goal: a file copied or cut in Finder or a Linux file manager pastes into the explorer, and a file copied or cut in the explorer pastes into the file manager.

Decisions already made by the user:
- A name clash never overwrites: the pasted entry gets a suffix (`note copy.md`, `note copy 2.md`).
- Platforms: macOS, Wayland, and X11.
- Work goes on the current branch `fix/review-and-fix`. Leave the unrelated uncommitted changes in `src/core/lang/code/highlight.ts` and `src/core/lang/markdown/highlight.test.ts` alone, and stage only this feature's files.

Platform facts this design relies on (checked on this machine):
- Finder puts `public.file-url` on the pasteboard, and `pbpaste` returns only the file's name. `osascript -l JavaScript` reads the full paths in about 70 ms.
- `osascript … -e 'function run(argv){…}' <paths…>` receives paths as argv, so paths never enter the script text.
- Finder has no file cut: Cmd+Opt+V moves at paste time. A cut in Finder therefore looks like a copy, and a cut in so cannot make Finder move. Linux file managers do record cut: GNOME uses `x-special/gnome-copied-files` (`cut\nfile:///…`) and KDE uses `application/x-kde-cutselection`.

## Behaviour

| Key | Command | Effect |
|---|---|---|
| `y` | `explorer.copy` | `explorer.clip = {op: "copy", paths: [cursor]}`, write the file URL to the system clipboard, message `Copied <name>` |
| `x` | `explorer.cut` | Same with `op: "cut"`. Cut entries are drawn dimmed. Message `Cut <name>` |
| `p` | `explorer.paste` | Read the system file clipboard, then paste into the cursor's folder (or the folder of the file under the cursor) |

How paste picks its sources (the reducer `onFileClip`):

```text
system clipboard has files?
 ├─ no / error / no provider → use explorer.clip, or show "nothing to paste"
 └─ yes → if its paths equal explorer.clip's paths, use explorer.clip's op (keeps a so cut on macOS)
          otherwise use the system clipboard's op (always copy on macOS)
for each source:
 ├─ inside the workspace, copy   → FsOp copy (rel → rel)
 ├─ inside the workspace, cut    → one path: link-safe move (same as `m`); several: plain moves + "links not updated" notice
 │                                 already in the target folder → skip it
 ├─ outside the workspace, copy  → FsOp copy {outside: true}
 └─ outside the workspace, cut   → FsOp move {outside: true} (rename; on EXDEV copy, then remove)
a folder pasted into itself or below itself → refused with "cannot paste a folder into itself"
a successful cut paste clears explorer.clip
```

Name clash: the pure `freeName(name, taken)` gives `a.md` → `a copy.md` → `a copy 2.md`. For folders it gives `dir copy`. `taken` is the target folder's listed entries plus the index's paths directly below it. The adapter still refuses an existing target with E13, so a race or an unlisted hidden file shows an error and never overwrites.

## Changes

### 1. Core types — `src/core/state/types.ts`
- `FsOp.kind` gets `"copy"`. Add `outside?: true` (doc: `from` is an absolute path outside the workspace). Update the doc comment, which currently says all paths are workspace-relative.
- `ExplorerState.clip?: { op: "copy" | "cut"; paths: string[] }` (workspace-relative).
- Add `"copy"` to the fs effect union (`{ kind: "create" | "rename" | "move" | "trash"; op }`, line ~796).
- New effects: `{ kind: "fileClipboardWrite"; op; paths: string[] }` (absolute paths) and `{ kind: "fileClipboardRead"; target: string }`.
- New action: `{ type: "fileClip"; target: string; clip: { op; paths: string[] } | null; error?: string }`.

### 2. Explorer reducer — `src/core/state/explorer.ts`
- `copyOrCut(s, op)`: does nothing when the cursor is `""`; otherwise sets `clip` and emits `fileClipboardWrite` with `` `${s.workspace.root}/${path}` ``.
- `startPaste(s)`: target = `kindOf(cursor) === "dir" ? cursor : dirname(cursor)`, then emit `fileClipboardRead`.
- `onFileClip(s, a, now)`: the flow above. Absolute paths become relative with a `rootRel(root, abs)` helper (`undefined` when the path is outside the root). Ops go out in order through the existing `explorerOp`, which flushes dirty buffers under `from` first, so a copy holds the saved text.
- `freeName` (exported for its unit test).
- `fsResultTree`: a `copy` case and an `outside` move case. Both select `to` and `relist(ancestors(to))` like `create`, and do not repath buffers.
- Link-safe single move: extract the op-building body of `submitRename` (`src/core/state/link-edits.ts:146-175`) into `moveWithLinks(s, from, to, now)`, called by both `submitRename` and paste. It keeps `requireIndex` and `refuseWhileRewriting`.

### 3. Index — `src/core/state/index.ts`
- `indexAfterFsOp`: `copy` and an `outside` move return `s` unchanged. The runner tells the worker, whose `changed()` already walks a new folder (`src/workspace/index-worker.ts:190-215`).

### 4. Commands and keys
- `src/core/state/commands.ts`: `explorer.copy` "Copy", `explorer.cut` "Cut", `explorer.paste` "Paste", next to `explorer.move`.
- `src/core/kernel/commands/defaults.ts`: explorer-mode `y`, `x`, `p`.
- `src/core/state/update.ts`: route `fileClip` to `onFileClip`.

### 5. File clipboard adapter — `src/workspace/system.ts`
```ts
export type FileClip = { op: "copy" | "cut"; paths: string[] };
export type FileClipboard = {
  name: string;
  write(clip: FileClip): Promise<void>;
  read(): Promise<FileClip | null>; // null: no files on the clipboard
};
export async function detectFileClipboard(d: SysDeps): Promise<FileClipboard>
```
- **macOS** (`osascript`): `write` uses JXA `NSPasteboard.clearContents` + `writeObjects(NSURL.fileURLWithPath(argv[i]))`. `read` uses `readObjectsForClassesOptions([NSURL], {NSPasteboardURLReadingFileURLsOnlyKey: true})` → JSON paths, and is always `copy`.
- **Wayland** (`wl-copy` + `wl-paste`) and **X11** (`xclip`), which share one type parser:
  - read: list the types (`wl-paste --list-types` / `xclip -o -selection clipboard -t TARGETS`). Prefer `x-special/gnome-copied-files` (first line is `copy`/`cut`), else `text/uri-list` plus `application/x-kde-cutselection` = `1` → cut.
  - write: these tools offer one type per call, so `XDG_CURRENT_DESKTOP` containing `KDE` → `text/uri-list` (always a copy); otherwise `x-special/gnome-copied-files` with `copy`/`cut`, which GNOME Files, Nemo, Caja, and Thunar read.
- No provider (tmux, SSH, OSC 52): `{name: "none"}`. `write` does nothing and `read` returns `null`, so paste works inside so only.
- URLs: `pathToFileURL` / `fileURLToPath` from `node:url`. Only `file://` entries count.
- Spawn runs argv only (no shell), like `commandProvider`.

### 6. File-system adapter — `src/workspace/fs.ts`
- `copyEntry(src: string, dest: string)` (absolute paths): refuses an existing `dest` (E13), `mkdir` the parent, then `cp(src, dest, { recursive: true, errorOnExist: true, force: false })`.
- `moveInto(src, dest)` for outside moves: refuse an existing target, then `rename`, and on `EXDEV` fall back to `copyEntry` + `rm`.

### 7. Effect runner — `src/app/effects.ts`, `src/app/main.ts`
- `RunnerDeps.fileClipboard: FileClipboard` (default `{name: "none", …}` in `main.ts`), detected next to `detectClipboard` after the first frame (`main.ts:439`).
- `runFsOp`: `copy` → `copyEntry(resolve(op), join(root, op.to))`. An `outside` move → `moveInto` + `ownOps.noteMove` skipped (the target is new to the watcher, which is correct).
- `case "copy"` and the `outside` move run on `serial`. After success, call `d.index?.notify({kind: "changed", path: to, isDir})` like `create` (`effects.ts:430-436`), and do not call `index.moved`.
- `fileClipboardWrite` → `d.fileClipboard.write`. A failure shows a message. `fileClipboardRead` → dispatch `fileClip`.

### 8. View — `src/ui/views/explorer.ts`
- The name token is `explorerDim` when the row is under a path of `clip` with `op === "cut"` (next to the gitignored check at line ~398).

### 9. Docs
- `.s1mple/docs/project.md`: add the explorer keys, the file clipboard adapter and its detection order, and the `copy` FsOp to the Effect execution and Config rows.
- Create a work folder `.s1mple/work/active/w261012frn6-explorer-file-clipboard/` holding this plan.

## Tests

| Layer | File | Cases |
|---|---|---|
| Unit | `src/core/state/explorer.test.ts` | `freeName` sequence for files, dotless files, and folders. `y`/`x` set clip + effect. Paste target folder. System clip wins over internal. Equal paths keep internal cut. Fallback to internal on `null`. Folder into itself refused. Cut inside → link-safe move with rewrite. Outside copy/move ops. Cut paste clears clip |
| Unit | `src/workspace/system.test.ts` | `detectFileClipboard` order (darwin+osascript, Wayland, X11, none). gnome-copied-files and uri-list + kde-cutselection parsing. Non-`file://` ignored. Percent-encoded paths |
| Unit | `src/workspace/fs.test.ts` | `copyEntry` file and folder, E13 on existing. `moveInto` across directories |
| Unit | `src/app/effects.test.ts` | `copy` runs on the serial queue and notifies the index. `fileClipboardRead` dispatches `fileClip`. Write failure is reported once |
| Integration | `test/integration/explorer-ops.test.ts` | With a fake `fileClipboard` in `startApp` (`test/integration/helpers.ts:186`): an outside file pastes in, a clash gets `copy`, an in-workspace cut updates links, `y` writes absolute paths |
| UI | `test/ui/file-ops.test.ts` | A cut row draws dimmed |

## Verification

1. `bun run check` (Biome, tsc, knip, unit suites) and `bun run test:ci`.
2. Manual on macOS with `bun run sandbox`. Finder Cmd+C a file and a folder → `p` in the explorer pastes them (a second paste gives `copy` names). `y` on a note → Finder Cmd+V copies it, Cmd+Opt+V moves it. `x` then `p` in another folder → the file moves and its links update.
3. Linux is checked through the parser unit tests with recorded clipboard payloads. A live check on GNOME and KDE stays open and is reported as not done if no Linux desktop is available.
4. Before running the sandbox, check for orphaned `so` processes, and stop every process started.

## Implementation Notes

Changes from the plan made while building it:

- `fileClip` carries `dirs` (the runner marks folders, so `freeName` keeps the dots in a name like `v1.2`) and `now` (the link rewrite's batch id needs a real time).
- The runner spells clipboard paths through `realpath`. The workspace root is not resolved, and Finder gives real paths (`/tmp` is `/private/tmp`).
- Large pastes show progress, as the user asked: `copyEntry` counts entries through `fs.cp`'s `filter`, and the runner sends `copyProgress` only after 300 ms and then every 100 ms at most. Copies still run on the serial queue, so saves wait behind a long one.
- A failed clipboard write dispatches its own `fileClipboardFailed` action. Reusing `clipboardText` could consume a pending `"+` put.
- An in-workspace cut whose name does not change can need fewer link edits than a rename. `[[plan]]` and `[x](plan.md)` still resolve by name, and only path links into a folder change.
