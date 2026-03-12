import { nextJsConfig } from "@ethereum-entity-registry/eslint-config/next-js"

/** @type {import("eslint").Linter.Config} */
export default [
  { ignores: ["next-env.d.ts"] },
  ...(Array.isArray(nextJsConfig) ? nextJsConfig : [nextJsConfig]),
]
