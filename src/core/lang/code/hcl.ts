import type { LanguageFn, Mode } from "highlight.js";

/** Terraform's reference roots, as in `var.region` or `data.aws_ami.id`. */
const REFERENCE_ROOTS = [
  "var",
  "local",
  "module",
  "data",
  "each",
  "count",
  "path",
  "self",
  "terraform",
];

/**
 * HashiCorp Configuration Language, which Terraform, Packer, and Terragrunt
 * files are written in. highlight.js ships no grammar for it.
 */
export const hcl: LanguageFn = (hljs) => {
  const keywords = {
    keyword: ["for", "in", "if", "else", "endif", "endfor"],
    literal: ["true", "false", "null"],
  };
  const reference = {
    scope: "variable",
    match: new RegExp(`\\b(?:${REFERENCE_ROOTS.join("|")})(?=\\.)`),
  };
  // Built-in functions and provider functions such as `provider::aws::arn_parse`.
  const call = {
    scope: "built_in",
    match: /\b[A-Za-z_]\w*(?:::[A-Za-z_]\w*)*(?=\()/,
  };
  const number = {
    scope: "number",
    match: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/,
    relevance: 0,
  };
  // `${…}` interpolation and `%{…}` template directives.
  const subst: Mode = {
    scope: "subst",
    begin: /[$%]\{/,
    end: /\}/,
    keywords,
    contains: [],
  };
  // `$${` and `%%{` are literal text.
  const escapedTemplate = { match: /[$%]{2}\{/ };
  const string = {
    scope: "string",
    begin: /"/,
    end: /"/,
    contains: [hljs.BACKSLASH_ESCAPE, escapedTemplate, subst],
  };
  const heredoc = hljs.END_SAME_AS_BEGIN({
    scope: "string",
    begin: /<<-?([A-Za-z_]\w*)[ \t]*$/,
    end: /^[ \t]*([A-Za-z_]\w*)$/,
    contains: [escapedTemplate, subst],
  });
  subst.contains = [string, reference, call, number];
  return {
    name: "HCL",
    aliases: ["terraform", "tf"],
    keywords,
    contains: [
      hljs.HASH_COMMENT_MODE,
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      heredoc,
      string,
      // A block's type, before its labels and `{`: `resource "aws_s3_bucket" "logs" {`.
      {
        scope: "keyword",
        match:
          /(?<=^[ \t]*)[A-Za-z_][\w-]*(?=(?:[ \t]+(?:"[^"\n]*"|[A-Za-z_][\w-]*))*[ \t]*\{)/,
      },
      // An attribute's name before `=`, never `==` or a `for` expression's `=>`.
      { scope: "attr", match: /\b[A-Za-z_][\w-]*(?=[ \t]*=(?![=>]))/ },
      reference,
      call,
      number,
    ],
  };
};
