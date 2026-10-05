// A file imported `with { type: "file" }` evaluates to its path.
declare module "*.wasm" {
  const path: string;
  export default path;
}
