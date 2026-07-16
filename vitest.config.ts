import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/app/**/*.ts"],
      exclude: [
        "src/app/**/*.spec.ts",
        "src/app/app.ts",
        "src/app/app.config.ts",
        "src/app/app.routes.ts",
        "src/app/features/facilities/routes.ts",
        "src/app/core/tokens/**",
        "src/app/core/interfaces/**",
        "src/app/core/dtos/**"
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90
      }
    }
  }
});
