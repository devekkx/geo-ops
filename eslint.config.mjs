// @ts-check
import angular from "angular-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    // Global performance ignores
    ignores: [".angular/**", "dist/**", "coverage/**", "node_modules/**"]
  },

  // TypeScript & Angular Source Files (.ts)
  {
    files: ["**/*.ts"],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...angular.configs.tsRecommended
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    processor: angular.processInlineTemplates,
    rules: {
      // --- Core TypeScript Safety ---
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true
        }
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "memberLike",
          modifiers: ["private"],
          format: null,
          leadingUnderscore: "require"
        }
      ],
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        {
          accessibility: "explicit",
          overrides: {
            constructors: "no-public"
          }
        }
      ],

      // --- Angular Best Practices & Optimization ---
      "@angular-eslint/component-selector": [
        "error",
        { type: "element", prefix: "geo", style: "kebab-case" }
      ],
      "@angular-eslint/directive-selector": [
        "error",
        { type: "attribute", prefix: "geo", style: "camelCase" }
      ],
      "@angular-eslint/no-input-rename": "error",
      "@angular-eslint/no-output-on-prefix": "error",
      "@angular-eslint/use-lifecycle-interface": "error",
      "@angular-eslint/prefer-standalone": "error"
    }
  },

  // Angular Templates
  {
    files: ["**/*.html"],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      "@angular-eslint/template/eqeqeq": "error",
      "@angular-eslint/template/no-duplicate-attributes": "error",
      "@angular-eslint/template/no-any": "error"
    }
  },

  // Prevents formatting rule collisions with Prettier
  eslintConfigPrettier
);
