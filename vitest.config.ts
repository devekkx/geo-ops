import { defineConfig } from "vitest/config";

// Angular's unit-test builder also needs `coverageInclude`/`coverageExclude` set in
// angular.json — it uses its own copy to scope what gets instrumented in the first
// place. Removing that copy silently zeroes out coverage attribution entirely, even
// though this file's settings are otherwise honored correctly (verified empirically).
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/app/**/*.ts"],
      exclude: [
        "src/app/**/*.spec.ts",
        "src/app/app.ts",
        "src/app/app.config.ts",
        "src/app/app.routes.ts",
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
