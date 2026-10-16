import { setWindow } from "./buffers";
import type { CommandContext } from "./commands";
import { none } from "./result";
import type { Result } from "./types";

/**
 * Show the active window's buffer as text, or back in the editor kind its
 * file type names (a page's HTML, a drawing's SVG).
 */
export function flipSource(c: CommandContext): Result {
  const s = c.state;
  const w = s.windows.byId[s.windows.active];
  const b = w === undefined ? undefined : s.buffers[w.content.bufferId];
  if (w === undefined || b === undefined) return none(s);
  const ft = c.reg.fileTypes.get(b.fileType);
  if (ft === undefined || ft.editor === "text" || ft.binary === true)
    return none(s);
  const { source, ...content } = w.content;
  return none(
    setWindow(s, {
      ...w,
      content: source === undefined ? { ...content, source: true } : content,
    }),
  );
}
