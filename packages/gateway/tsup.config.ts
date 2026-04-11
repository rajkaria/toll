import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["express", "@modelcontextprotocol/sdk", "@rajkaria123/toll-stellar", "better-sqlite3"],
})
