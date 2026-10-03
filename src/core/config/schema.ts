import { z } from "zod";
import { splitKeys } from "../kernel/vim/keys";

/** `"<key-seq>" = "<command-id>"` */
const KeyTable = z.record(z.string().min(1), z.string().min(1));
/** Mode → key table; modes are checked against the registered bindings when applied. */
const KeyBindingsSchema = z.record(z.string().min(1), KeyTable);

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
  editor: z
    .strictObject({
      tabWidth: z.number().int().min(1).max(16).default(8),
      wrap: z.boolean().default(true),
      relativeNumbers: z.boolean().default(true),
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
