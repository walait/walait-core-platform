import path from "node:path";
import { Options as SwcOptions } from "@swc/core";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

const swcConfig = {
  jsc: {
    parser: {
      syntax: "typescript",
      decorators: true,
    },
    transform: {
      decoratorMetadata: true,
    },
  },
  module: {
    type: "es6",
  },
  sourceMaps: true,
} satisfies SwcOptions;

export default defineConfig({
  plugins: [swc.vite(swcConfig)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@apps": path.resolve(__dirname, "src/apps"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@taxes-ar/afip": path.resolve(
        __dirname,
        "src/modules/taxes/infrastructure/ar/afip",
      ),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts"],
    setupFiles: ["test/vitest.setup.ts"],
  },
});
