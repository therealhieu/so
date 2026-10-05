# W261005OXA5: image-zoom-overlay

## Sources

| Source | Use |
|---|---|
| `.s1mple/S1MPLE.md` | Discuss behavior and required context |
| `.s1mple/docs/project.md` | Reusable project baseline |
| `src/core/state/types.ts`, `src/core/state/mouse.ts`, `src/ui/editors/text-view.ts`, `src/ui/overlays/host.ts` | Overlay state, mouse targets, the click path, and float drawing |
| `src/core/lang/markdown/renderers/{image,mermaid,rows}.ts`, `src/ui/widgets/{image,registry}.ts`, `src/ui/images.ts`, `src/core/state/markdown-view.ts` | How images and Mermaid diagrams are laid out and painted today |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-ui-design.md` | Float sizing convention |

## Roadmap Binding

None — standalone work

## 1. User Input

### Original Input

develop new feature: click on an image/diagram: overlay zoom dialog. propose

### Consolidated Requirement or Problem

In a note's rendered views (`live`, `reading`), clicking an image embed or a rendered diagram (Mermaid) should open an overlay dialog that shows that image or diagram enlarged, so small or downscaled images can be inspected without leaving the note. Images render at natural size and shrink to the window width (`src/core/state/markdown-view.ts:12`), so large images are downscaled in the note; Mermaid diagrams are box-drawing text fit to the window width, and a diagram wider than the window shows as source.

### Constraints and Assumptions

- Every mouse action must run the same path as a keyboard action (`.s1mple/docs/project.md`, mouse section), so the zoom needs a keyboard command too.
- `src/core` stays pure: no `@opentui/*`, I/O, or runtime imports (`.s1mple/docs/languages/typescript.md`, boundaries in `project.md`).
- One overlay is open at a time (`Overlay` is a single union, `src/core/state/types.ts:193`).
- Assumption: the user means the in-terminal TUI, not the browser preview (`:Preview`).

## 2. Project Structure

- `src/core/state/types.ts` — `Overlay` union (`:193-200`), `WindowSpot` and `MouseTarget` (`:296-322`).
- `src/core/state/mouse.ts` — `onMouse` reducer, overlay gate, press dispatch.
- `src/ui/editors/text-view.ts` — `targetAt`/`textAt` map a cell to a `MouseTarget`; widget painting loop.
- `src/ui/overlays/` — `host.ts` (`drawFrame`, `centered`, `OverlayHost`), one view per overlay kind (`picker.ts`, `prompt.ts`, `conflict.ts`, `calendar.ts`, `whichkey.ts`, `completion.ts`).
- `src/core/lang/markdown/renderers/image.ts` — image block → `image` widget.
- `src/core/lang/markdown/renderers/mermaid.ts` — Mermaid fence → `text` widget of box-drawing lines.
- `src/ui/widgets/image.ts` — `paintImage` widget painter; `src/ui/widgets/registry.ts` — `registerWidgetPainter`.
- `src/ui/images.ts` — `imageTier`, `ImageCache` (decoded pixels, 64 MiB).
- `src/core/state/markdown-view.ts` — `imageRows`, the Markdown `PreviewCtx` builder.

## 3. Standards and Patterns

### Applicable Standards

- `.s1mple/docs/project.md` (Architecture and Key Flows) — mouse input goes `MouseLayer → router → first source in z-order → onMouse`, and `onMouse` replays the matching keyboard path.
- `.s1mple/docs/project.md` (Boundaries) — only `src/ui` imports `@opentui/*`; `beautiful-mermaid` is imported only from `src/core/lang/markdown/`.
- `.s1mple/S1MPLE.md` (Implementation) — no work-process identifiers in code.
- `rm261003abzp-ui-design.md:702` — float sizes are percentages of the terminal, clamped to min 60×12.

### Existing Patterns

- `src/core/state/types.ts:296-305` — special clickable regions are `WindowSpot` kinds (`fold`, `baseTab`, `baseCell`, `baseCard`), which `text-view` reports and `mouse.ts` handles.
- `src/core/state/mouse.ts:473-476` — a press on a `fold` spot runs the same reducer as `za` (`flipFold`) without moving the cursor.
- `src/core/state/mouse.ts:91-110` — `overlayGate`: a press outside an open overlay closes it like `<Esc>`; prompt and conflict dialogs ignore the mouse.
- `src/ui/overlays/host.ts:14` and `:36` — `drawFrame` (rounded border, title, footer) and `centered(s, w, h)` are how overlays size and draw floats.
- `src/ui/widgets/image.ts:28-61` — `paintImage` draws a decoded image with `buf.drawImage` at a chosen cell size and tier; it shows `◌ name` while loading and `[image: name]` when it can't draw.
- `src/core/lang/markdown/renderers/mermaid.ts:108-130` — `mermaidText(source, width)` lays a diagram out to fit `width`, trying a tighter spacing before falling back to source; results are cached per block hash and width (`:133-138`).

## 4. Architecture

```text
src/core (pure)                                     src/ui (OpenTUI)
──────────────────────────────────────────          ─────────────────────────────────────────
renderers/image.ts   → widget {type:"image",        widgets/image.ts paintImage → buf.drawImage
                         data:{path,name}, rows}      (tier: kitty | sixel | blocks | placeholder)
renderers/mermaid.ts → widget {type:"text",         text painter (spans)
                         data: rows of spans}
state/types.ts Overlay ─────────────────────────────► overlays/host.ts OverlayHost (one view per kind)
state/mouse.ts onMouse ◄── MouseTarget ───────────── editors/text-view.ts targetAt / textAt
state/markdown-view.ts imageRows ◄── ViewHost{cell px} ◄── images.ts ImageCache.cellSize()
```

- `imageRenderer` — decides the widget and its row count; never decodes.
- `paintImage` — draws decoded pixels into the widget's cells; derives columns from rows.
- `ImageCache` — owns decoded pixels (shared across windows), keyed by path or URL.
- `mermaidRenderer` — produces text rows sized to the window width.
- `OverlayHost` — paints the one open overlay above the body; each overlay view also answers `itemAt` for mouse hits.
- `onMouse` — pure reducer; handles the overlay gate, focus, then press/drag/wheel.

## 5. Code Flow

```text
click on an image row in a note window
  → MouseLayer → router → TextView.targetAt(x, y)
  → textAt: row is a widget row (widget && spans empty) → col 0
  → MouseTarget {window, spot:{kind:"text", pos:{line: block line, col: 0}}}
  → onMouse → overlayGate (no overlay) → press → pressText
  → placeAt(pos): cursor moves to the image line
  → live view: the cursor's line reveals source (`![[x.png]]` shows); reading view: cursor moves only
```

1. `text-view.ts:471-489` — on a widget row, `textAt` reports a `text` spot at column 0 of the widget's source line; it does not say which widget was hit.
2. `mouse.ts:326-336` — `press` sends a `text` spot to `pressText`.
3. `mouse.ts:348-375` — `pressText` places the cursor; a double click selects a word, a triple click the line, and Ctrl+click follows a link.
4. There is no overlay kind that shows an image or diagram, and no command to open one.

## 6. Boundaries

### In Scope

- A click on an image embed (`![[x.png]]`, `![](x.png)`, web URL images) in `live` and `reading` views opens a zoom overlay.
- A click on a rendered Mermaid diagram opens the same kind of overlay.
- A keyboard command that opens the same overlay for the image or diagram at the cursor.
- Closing the overlay with `<Esc>`, `q`, or a click outside it.

### Out of Scope

- The browser preview (`:Preview`), which has its own page.
- Image editing, saving, or copying.
- `source` view, where images and diagrams are not rendered.
- Embedded notes and Base embeds.

### Interfaces and Dependencies

- `Overlay` union (`src/core/state/types.ts:193`) — needs a new kind.
- `WindowSpot` / `MouseTarget` (`src/core/state/types.ts:296-322`) — the image or diagram hit must be distinguishable from a text hit.
- `PaintTarget` / `registerWidgetPainter` (`src/ui/widgets/registry.ts`) — overlay painting can reuse `paintImage` logic.
- `ImageCache` (`src/ui/images.ts`) — the decoded image is already cached when the overlay opens; the overlay draws from it.
- `mermaidText(source, width)` — can lay a diagram out at the overlay's width.
- OpenTUI `buf.drawImage` and its placement lifecycle ("OpenTUI removes a placement on the first frame that does not draw it", `src/ui/widgets/image.ts:22-27`).

## 7. Unknowns

- Whether kitty and sixel image placements in the note window draw above the overlay's text cells; if so, the window's images must not be drawn while the overlay covers them.
- What "zoom" means: fit the overlay (largest size that fits the terminal), natural pixel size with panning, or stepped zoom levels.
- Which click opens it: a single click (the current behavior of moving the cursor and, in `live`, revealing the source would change), a double click, or Ctrl+click.
- The keyboard binding for the command, and whether it uses the cursor's block or the image under the cursor's line.
- What the overlay shows on terminals without graphics (`blocks` tier) or with `preview.images = "off"` (placeholder).
- Whether a Mermaid diagram that shows as source in the window (wider than the window) should draw in the overlay at the wider width.
- Whether the overlay shows a title (file name, alt text) and pixel dimensions.
