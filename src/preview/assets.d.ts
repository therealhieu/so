// A file imported `with { type: "file" }` evaluates to its path.
declare module "*.css" {
  const path: string;
  export default path;
}
declare module "*.woff2" {
  const path: string;
  export default path;
}
declare module "*.min.js" {
  const path: string;
  export default path;
}
declare module "*/page.js" {
  const path: string;
  export default path;
}
