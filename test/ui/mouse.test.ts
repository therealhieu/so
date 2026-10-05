import { afterEach, expect, test } from "bun:test";
import { parseConfig } from "../../src/core/config/toml";
import { type Mounted, mountShell } from "../support/ui";

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

const cursorOf = (mounted: Mounted) => {
  const s = mounted.store.get();
  return s.windows.byId[s.windows.active]?.content.cursor;
};

test("mouse reporting follows the mouse setting", async () => {
  m = await mountShell({ cols: 80, rows: 12 });
  await m.frame();
  expect(m.t.renderer.useMouse).toBe(true);
  m.destroy();

  m = await mountShell({ cols: 80, rows: 12, config: "mouse = false\n" });
  m.open("a.md", "alpha\nbravo\ncharlie\n");
  await m.frame();
  expect(m.t.renderer.useMouse).toBe(false);
  await m.mouse.click(10, 3);
  await m.frame();
  expect(cursorOf(m)).toEqual({ line: 0, col: 0 });

  // A reload that turns the mouse on turns reporting on with the next paint.
  m.store.dispatch({
    type: "configLoaded",
    result: parseConfig("mouse = true\n"),
    reload: true,
  });
  expect(m.t.renderer.useMouse).toBe(true);
});
