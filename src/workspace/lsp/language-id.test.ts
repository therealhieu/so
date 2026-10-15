import { expect, test } from "bun:test";
import { languageIdFor } from "./language-id";

test("Terraform variable files get their own language id", () => {
  expect(languageIdFor("terraform", "/r/infra/main.tf")).toBe("terraform");
  expect(languageIdFor("terraform", "/r/infra/prod.tfvars")).toBe(
    "terraform-vars",
  );
});
