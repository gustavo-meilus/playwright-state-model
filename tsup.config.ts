import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: true,
    treeshake: true,
    external: ["@playwright/test", "xstate"],
  },
  {
    entry: ["src/cli/init-agents.ts"],
    format: ["cjs"],
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false,
    minify: false,
    treeshake: false,
    banner: {
      js: "#!/usr/bin/env node",
    },
    outDir: "dist/cli",
  },
]);
