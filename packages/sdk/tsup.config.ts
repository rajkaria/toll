import { defineConfig } from "tsup"
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  target: "es2022",
  clean: true,
  sourcemap: true,
  external: ["@x402/core", "@x402/stellar", "@stellar/stellar-sdk"],
})
