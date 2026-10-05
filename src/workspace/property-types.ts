import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  type PropertyTypes,
  parsePropertyTypes,
} from "../core/features/bases/property-types";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Obsidian's property type assignments from `.obsidian/types.json`, which the
 * walker never lists because dot folders are hidden. Never throws: a missing
 * file gives none, and an unreadable or malformed one gives none and is
 * reported through `onInvalid`.
 */
export async function readPropertyTypes(
  root: string,
  onInvalid: (reason: string) => void = () => {},
): Promise<PropertyTypes> {
  let text: string;
  try {
    text = await readFile(join(root, ".obsidian", "types.json"), "utf8");
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code !== "ENOENT" && code !== "ENOTDIR")
      onInvalid(code ?? "unreadable");
    return {};
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    onInvalid("not JSON");
    return {};
  }
  if (!isRecord(json) || !isRecord(json.types)) {
    onInvalid("no types object");
    return {};
  }
  return parsePropertyTypes(json);
}
