import type { FileType } from "../../filetypes/registry";
import { lowlightHighlighter } from "./highlight";

type LanguageSpec = {
  /** A grammar name or alias registered with lowlight. */
  id: string;
  extensions: readonly string[];
  names?: readonly string[];
};

/**
 * Every lowlight `common` grammar except `shell` and `python-repl` (console
 * sessions, no file extension) and `plaintext` (the `text` file type), plus
 * `dockerfile` and `hcl` (`terraform` is its alias). Markdown's file type
 * lives in `lang/markdown`.
 */
export const CODE_LANGUAGES = [
  { id: "typescript", extensions: [".ts", ".tsx", ".mts", ".cts"] },
  { id: "javascript", extensions: [".js", ".jsx", ".mjs", ".cjs"] },
  { id: "json", extensions: [".json", ".jsonc"] },
  { id: "yaml", extensions: [".yaml", ".yml"] },
  { id: "ini", extensions: [".toml", ".ini", ".cfg"] },
  { id: "bash", extensions: [".sh", ".bash", ".zsh"] },
  { id: "xml", extensions: [".xml", ".svg"] },
  {
    id: "makefile",
    extensions: [".mk"],
    names: ["Makefile", "GNUmakefile", "makefile"],
  },
  { id: "markdown", extensions: [".md"] },
  { id: "python", extensions: [".py", ".pyi", ".pyw"] },
  { id: "css", extensions: [".css"] },
  { id: "scss", extensions: [".scss"] },
  { id: "less", extensions: [".less"] },
  { id: "go", extensions: [".go"] },
  { id: "rust", extensions: [".rs"] },
  { id: "c", extensions: [".c", ".h"] },
  { id: "cpp", extensions: [".cpp", ".cc", ".cxx", ".hpp", ".hh", ".hxx"] },
  { id: "csharp", extensions: [".cs"] },
  { id: "java", extensions: [".java"] },
  { id: "kotlin", extensions: [".kt", ".kts"] },
  { id: "swift", extensions: [".swift"] },
  { id: "objectivec", extensions: [".m", ".mm"] },
  { id: "php", extensions: [".php"] },
  { id: "php-template", extensions: [".phtml"] },
  { id: "ruby", extensions: [".rb"], names: ["Gemfile", "Rakefile"] },
  { id: "perl", extensions: [".pl", ".pm"] },
  { id: "lua", extensions: [".lua"] },
  { id: "r", extensions: [".r"] },
  { id: "sql", extensions: [".sql"] },
  { id: "graphql", extensions: [".graphql", ".gql"] },
  { id: "diff", extensions: [".diff", ".patch"] },
  { id: "wasm", extensions: [".wat", ".wast"] },
  { id: "vbnet", extensions: [".vb"] },
  { id: "arduino", extensions: [".ino"] },
  {
    id: "dockerfile",
    extensions: [".dockerfile"],
    names: ["Dockerfile", "Containerfile"],
  },
  { id: "terraform", extensions: [".tf", ".tfvars"] },
  { id: "hcl", extensions: [".hcl"] },
] as const satisfies readonly LanguageSpec[];

/** One source-view file type per language except Markdown. */
export const codeFileTypes: FileType[] = CODE_LANGUAGES.filter(
  (l) => l.id !== "markdown",
).map((l: LanguageSpec) => ({
  id: l.id,
  match:
    l.names === undefined
      ? { extensions: l.extensions }
      : { extensions: l.extensions, names: l.names },
  editor: "text",
  views: [{ id: "source", decorations: [] }],
  highlighter: lowlightHighlighter(l.id),
}));
