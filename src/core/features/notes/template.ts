import { formatDate } from "../../time/format";
import type { LocalDateTime } from "../../time/local";

export type TemplateVars = { title: string; at: LocalDateTime };

/** Used when the configured daily template does not exist. */
export const BUILTIN_DAILY_TEMPLATE = "# {{date}}";

/**
 * Obsidian's template expansion: `{{title}}`, then `{{date}}`, `{{time}}`,
 * `{{date:FORMAT}}`, and `{{time:FORMAT}}`, names matched without regard to
 * case and without trimming spaces. One instant serves every occurrence, an
 * empty format uses the default, and other `{{…}}` text is left alone.
 */
export function expandTemplate(text: string, vars: TemplateVars): string {
  return text
    .replace(/\{\{title\}\}/gi, () => vars.title)
    .replace(
      /\{\{(date|time)(?::(.*?))?\}\}/gi,
      (_, kind: string, fmt: string | undefined) =>
        formatDate(
          vars.at,
          fmt ? fmt : kind.toLowerCase() === "date" ? "YYYY-MM-DD" : "HH:mm",
        ),
    );
}
