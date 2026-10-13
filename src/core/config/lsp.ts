import { z } from "zod";
import { CODE_LANGUAGES } from "../lang/code/file-types";

/** File types a language server may serve: every code language, never notes. */
export const LSP_FILE_TYPES: readonly string[] = CODE_LANGUAGES.map(
  (l) => l.id,
).filter((id) => id !== "markdown");

/** A marker file name, or a list of names with equal priority. */
export type RootMarker = string | readonly string[];

/** The probed major version a built-in serves: `atLeast` ≤ major < `below`. */
export type VersionGate = {
  probe: readonly string[];
  atLeast?: number;
  below?: number;
};

export type ServerSpec = {
  name: string;
  /** argv, run without a shell. */
  command: readonly string[];
  fileTypes: readonly string[];
  rootMarkers: readonly RootMarker[];
  rootSearch: "nearest" | "topmost";
  settings: Record<string, unknown>;
  initOptions?: Record<string, unknown>;
  snippets: boolean;
  /** Look in the root's `node_modules/.bin` before `PATH`. */
  localBin: boolean;
  gate?: VersionGate;
};

const TS_LOCKS = [
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  "bun.lock",
];
const TS_MARKERS: readonly RootMarker[] = [
  TS_LOCKS,
  ["tsconfig.json", "jsconfig.json", "package.json"],
  ".git",
];
const TSC_PROBE = ["tsc", "--version"];
/** TypeScript servers send inlay hints only for the kinds these settings turn on. */
const TS_INLAY_HINTS = {
  includeInlayParameterNameHints: "all",
  includeInlayParameterNameHintsWhenArgumentMatchesName: false,
  includeInlayFunctionParameterTypeHints: true,
  includeInlayVariableTypeHints: true,
  includeInlayVariableTypeHintsWhenTypeMatchesName: false,
  includeInlayPropertyDeclarationTypeHints: true,
  includeInlayFunctionLikeReturnTypeHints: true,
  includeInlayEnumMemberValueHints: true,
};
const TS_SETTINGS = {
  typescript: { inlayHints: TS_INLAY_HINTS },
  javascript: { inlayHints: TS_INLAY_HINTS },
};

const COMPOSE_SCHEMA =
  "https://raw.githubusercontent.com/compose-spec/compose-spec/master/schema/compose-spec.json";

/** The servers `so` knows, in routing order. */
export const BUILTIN_SERVERS: readonly ServerSpec[] = [
  {
    name: "tsc",
    command: ["tsc", "--lsp", "--stdio"],
    fileTypes: ["typescript", "javascript"],
    rootMarkers: TS_MARKERS,
    rootSearch: "nearest",
    settings: TS_SETTINGS,
    snippets: false,
    localBin: true,
    gate: { probe: TSC_PROBE, atLeast: 7 },
  },
  {
    name: "typescript",
    command: ["typescript-language-server", "--stdio"],
    fileTypes: ["typescript", "javascript"],
    rootMarkers: TS_MARKERS,
    rootSearch: "nearest",
    settings: TS_SETTINGS,
    snippets: false,
    localBin: true,
    gate: { probe: TSC_PROBE, below: 7 },
  },
  {
    name: "pyright",
    command: ["pyright-langserver", "--stdio"],
    fileTypes: ["python"],
    rootMarkers: [
      [
        "pyrightconfig.json",
        "pyproject.toml",
        "setup.py",
        "setup.cfg",
        "requirements.txt",
        "Pipfile",
      ],
    ],
    rootSearch: "nearest",
    settings: {},
    snippets: false,
    localBin: false,
  },
  {
    name: "gopls",
    command: ["gopls"],
    fileTypes: ["go"],
    rootMarkers: ["go.work", "go.mod", ".git"],
    rootSearch: "nearest",
    // gopls reads its settings from the "gopls" section.
    settings: {
      gopls: {
        hints: {
          assignVariableTypes: true,
          compositeLiteralFields: true,
          constantValues: true,
          functionTypeParameters: true,
          parameterNames: true,
          rangeVariableTypes: true,
        },
      },
    },
    snippets: false,
    localBin: false,
  },
  {
    name: "rust-analyzer",
    command: ["rust-analyzer"],
    fileTypes: ["rust"],
    rootMarkers: ["Cargo.toml"],
    rootSearch: "topmost",
    settings: {},
    snippets: false,
    localBin: false,
  },
  {
    name: "clangd",
    command: ["clangd"],
    fileTypes: ["c", "cpp", "objectivec"],
    rootMarkers: [
      [
        ".clangd",
        ".clang-tidy",
        ".clang-format",
        "compile_commands.json",
        "compile_flags.txt",
        "configure.ac",
      ],
      ".git",
    ],
    rootSearch: "nearest",
    settings: {},
    snippets: false,
    localBin: false,
  },
  {
    name: "json",
    command: ["vscode-json-language-server", "--stdio"],
    fileTypes: ["json"],
    rootMarkers: [],
    rootSearch: "nearest",
    settings: {},
    initOptions: { provideFormatter: true },
    snippets: true,
    localBin: true,
  },
  {
    name: "yaml",
    command: ["yaml-language-server", "--stdio"],
    fileTypes: ["yaml"],
    rootMarkers: [],
    rootSearch: "nearest",
    // Patterns match the file name in any folder.
    settings: {
      yaml: {
        schemas: {
          [COMPOSE_SCHEMA]: [
            "docker-compose.yml",
            "docker-compose.yaml",
            "docker-compose.*.yml",
            "docker-compose.*.yaml",
            "compose.yml",
            "compose.yaml",
            "compose.*.yml",
            "compose.*.yaml",
          ],
        },
      },
    },
    snippets: true,
    localBin: true,
  },
];

const BUILTIN_NAMES = new Set(BUILTIN_SERVERS.map((s) => s.name));

const Marker = z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]);

/** A built-in override, or a complete definition for a new name. */
const ServerEntry = z.strictObject({
  enabled: z.boolean().optional(),
  command: z.array(z.string().min(1)).min(1).optional(),
  fileTypes: z.array(z.enum(LSP_FILE_TYPES)).min(1).optional(),
  rootMarkers: z.array(Marker).optional(),
  rootSearch: z.enum(["nearest", "topmost"]).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  initOptions: z.record(z.string(), z.unknown()).optional(),
  snippets: z.boolean().optional(),
});
type ServerEntry = z.infer<typeof ServerEntry>;

export const LspConfigSchema = z
  .strictObject({
    enabled: z.boolean().default(true),
    formatOnSave: z.boolean().default(false),
    inlayHints: z.boolean().default(true),
    endOfLineDiagnostics: z.boolean().default(true),
    servers: z.record(z.string().min(1), ServerEntry).default({}),
  })
  .superRefine((c, ctx) => {
    for (const [name, s] of Object.entries(c.servers))
      if (
        !BUILTIN_NAMES.has(name) &&
        (s.command === undefined || s.fileTypes === undefined)
      )
        ctx.addIssue({
          code: "custom",
          path: ["servers", name],
          message: "a new server needs command and fileTypes",
        });
  });

export type LspConfig = z.infer<typeof LspConfigSchema>;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** `base` with every field `entry` sets replaced. */
function merge(base: ServerSpec, entry: ServerEntry): ServerSpec {
  const spec: ServerSpec = {
    ...base,
    command: entry.command ?? base.command,
    fileTypes: entry.fileTypes ?? base.fileTypes,
    rootMarkers: entry.rootMarkers ?? base.rootMarkers,
    rootSearch: entry.rootSearch ?? base.rootSearch,
    settings: entry.settings ?? base.settings,
    snippets: entry.snippets ?? base.snippets,
  };
  if (entry.initOptions !== undefined) spec.initOptions = entry.initOptions;
  return spec;
}

/** Built-ins in table order with overrides applied and disabled ones removed, then added servers in config order. */
export function resolveServers(c: LspConfig): ServerSpec[] {
  const out: ServerSpec[] = [];
  for (const base of BUILTIN_SERVERS) {
    const entry = c.servers[base.name];
    if (entry?.enabled === false) continue;
    const spec = entry === undefined ? base : merge(base, entry);
    // rust-analyzer reads its settings only from initializationOptions.
    const rust = spec.settings["rust-analyzer"];
    if (
      spec.name === "rust-analyzer" &&
      spec.initOptions === undefined &&
      isObject(rust)
    )
      out.push({ ...spec, initOptions: rust });
    else out.push(spec);
  }
  for (const [name, entry] of Object.entries(c.servers)) {
    if (BUILTIN_NAMES.has(name) || entry.enabled === false) continue;
    if (entry.command === undefined || entry.fileTypes === undefined) continue;
    const spec: ServerSpec = {
      name,
      command: entry.command,
      fileTypes: entry.fileTypes,
      rootMarkers: entry.rootMarkers ?? [],
      rootSearch: entry.rootSearch ?? "nearest",
      settings: entry.settings ?? {},
      snippets: entry.snippets ?? false,
      localBin: false,
    };
    if (entry.initOptions !== undefined) spec.initOptions = entry.initOptions;
    out.push(spec);
  }
  return out;
}

/** True when `major` satisfies the gate. An unknown major passes only a gate with `below` and no `atLeast`. */
export function gateAllows(
  gate: VersionGate,
  major: number | undefined,
): boolean {
  if (major === undefined)
    return gate.below !== undefined && gate.atLeast === undefined;
  return (
    (gate.atLeast === undefined || major >= gate.atLeast) &&
    (gate.below === undefined || major < gate.below)
  );
}
