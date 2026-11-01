import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["**/dist/", "**/coverage/", "api/", "shared/src/generated/"]),

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/only-throw-error": [
        "error",
        {
          // Route loaders signal HTTP errors by throwing React Router's data() responses.
          allow: [{ from: "package", package: "react-router", name: "DataWithResponseInit" }],
        },
      ],
    },
  },

  {
    files: ["**/*.{js,mjs}"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },

  {
    files: ["web/src/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat["recommended-latest"], reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
  },

  // Domain logic stays pure so it can be unit tested and mirrored in Python.
  {
    files: ["web/src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react/*",
                "react-dom",
                "react-dom/*",
                "react-router",
                "react-router/*",
              ],
              message: "web/src/domain must stay framework-free: no React imports.",
            },
            {
              group: ["three", "three/*", "@react-three/*"],
              message: "web/src/domain must stay framework-free: no three.js imports.",
            },
            {
              group: ["firebase", "firebase/*"],
              message: "web/src/domain must stay framework-free: no Firebase imports.",
            },
          ],
        },
      ],
    },
  },

  prettier,
]);
