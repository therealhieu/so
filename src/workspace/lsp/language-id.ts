import { extname } from "node:path";

const BY_EXTENSION: Record<string, string> = {
  ".tsx": "typescriptreact",
  ".jsx": "javascriptreact",
};
const BY_TYPE: Record<string, string> = { objectivec: "objective-c" };

/** The LSP language id of a file: by extension where it differs, else by file type. */
export function languageIdFor(fileType: string, path: string): string {
  return BY_EXTENSION[extname(path)] ?? BY_TYPE[fileType] ?? fileType;
}
