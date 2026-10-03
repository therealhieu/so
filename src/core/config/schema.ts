import { z } from "zod";

const ConfigSchema = z.object({
  escTimeoutMs: z.number().int().min(0).default(50),
  autosave: z
    .object({
      enabled: z.boolean().default(true),
      delayMs: z.number().int().min(0).default(1000),
    })
    .prefault({}),
  theme: z.enum(["dark", "light"]).default("dark"),
  color: z.enum(["auto", "never"]).default("auto"),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export const defaults: AppConfig = ConfigSchema.parse({});
