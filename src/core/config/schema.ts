import { z } from "zod";
import { splitKeys } from "../kernel/vim/keys";

/** `"<key-seq>" = "<command-id>"` */
const KeyTable = z.record(z.string().min(1), z.string().min(1));
/** Mode → key table; modes are checked against the registered bindings when applied. */
const KeyBindingsSchema = z.record(z.string().min(1), KeyTable);

/**
 * `path` without "." segments, ".." resolved, and no trailing "/"; `undefined`
 * when it is absolute, uses "\\", or leaves the workspace.
 */
function normalizePath(path: string): string | undefined {
  if (path.startsWith("/") || path.includes("\\")) return undefined;
  const segments: string[] = [];
  for (const segment of path.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment !== "..") segments.push(segment);
    else if (segments.pop() === undefined) return undefined;
  }
  return segments.join("/");
}

/** A workspace-relative path, normalized; `root: "deny"` also refuses the workspace root. */
const workspacePath = (opts: { root: "allow" | "deny" }) =>
  z.string().transform((path, ctx) => {
    const normalized = normalizePath(path);
    if (normalized === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "must be a path inside the workspace",
      });
      return z.NEVER;
    }
    if (normalized === "" && opts.root === "deny") {
      ctx.addIssue({
        code: "custom",
        message: "must not be the workspace root",
      });
      return z.NEVER;
    }
    return normalized;
  });

/** The whole config file; any key not listed here is an error. */
export const ConfigSchema = z.strictObject({
  /** One key in Vim notation, stored as that key ("<space>" → " "). */
  leader: z
    .string()
    .refine((k) => splitKeys(k).length === 1, "must be one key")
    .transform((k) => splitKeys(k)[0] ?? k)
    .default(" "),
  escTimeoutMs: z.number().int().min(0).default(50),
  autosave: z
    .strictObject({
      enabled: z.boolean().default(true),
      delayMs: z.number().int().min(0).default(1000),
    })
    .prefault({}),
  theme: z.enum(["dark", "light"]).default("dark"),
  color: z.enum(["auto", "never"]).default("auto"),
  /** Terminal mouse reporting: clicks, drags, and the wheel. */
  mouse: z.boolean().default(true),
  editor: z
    .strictObject({
      tabWidth: z.number().int().min(1).max(16).default(8),
      wrap: z.boolean().default(true),
      relativeNumbers: z.boolean().default(true),
    })
    .prefault({}),
  /** The docked explorer's edge; the side panel docks on the other one. */
  explorer: z
    .strictObject({
      position: z.enum(["left", "right"]).default("left"),
    })
    .prefault({}),
  preview: z
    .strictObject({
      mode: z.enum(["live", "source", "reading"]).default("live"),
      embedMaxRows: z.number().int().min(1).max(200).default(10),
      images: z.enum(["auto", "blocks", "off"]).default("auto"),
    })
    .prefault({}),
  daily: z
    .strictObject({
      folder: workspacePath({ root: "allow" }).default("daily"),
      format: z.string().min(1).default("YYYY-MM-DD"),
      template: workspacePath({ root: "deny" }).default("templates/daily.md"),
    })
    .prefault({}),
  templates: z
    .strictObject({
      folder: workspacePath({ root: "deny" }).default("templates"),
    })
    .prefault({}),
  keys: KeyBindingsSchema.default({}),
  filetypes: z
    .record(
      z.string().min(1),
      z.strictObject({ keys: KeyBindingsSchema.default({}) }),
    )
    .default({}),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export const defaults: AppConfig = ConfigSchema.parse({});
