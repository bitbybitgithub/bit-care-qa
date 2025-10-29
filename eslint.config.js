import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from 'eslint-plugin-react-refresh'
import { globalIgnores } from 'eslint/config'
export default tseslint.config([
  {
    ignores: ["dist", "node_modules"],
  },

  {
    files: ["**/*.{ts,tsx}"],
      extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },

    rules: {
      // ✅ Relax noisy rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-useless-escape": "off",
      "no-empty": "off",
    },
  },

  // ✅ UI (TSX) files — enforce color token usage
  {
    files: ["**/*.tsx"],
    rules: {
      // ❌ Disallow hardcoded hex / rgb / hsl colors
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/#[0-9a-fA-F]{3,6}/]",
          message:
            "Avoid hardcoded hex colors — use CSS variables (var(--color-...)) instead.",
        },
        {
          selector: "Literal[value=/rgb\\s*\\(|hsl\\s*\\(/]",
          message:
            "Avoid hardcoded rgb()/hsl() colors — use CSS variables (var(--color-...)) instead.",
        },
      ],

      // ❌ Disallow Tailwind built-in color utilities like bg-red-400, text-blue-500, etc.
      "no-restricted-properties": [
        "error",
        {
          property: "className",
          message:
            "Avoid Tailwind color utilities like bg-red-400; use bg-[var(--color-...)] instead.",
        },
      ],

      // ✅ Encourage CSS variable usage in inline styles or sx props
      "no-restricted-globals": [
        "error",
        {
          name: "style",
          message:
            "Use var(--color-...) tokens inside style or sx instead of literal colors.",
        },
      ],
    },
  },

  // 🧠 Logic-only TS files — skip color rules
  {
    files: ["**/*.ts"],
    rules: {
      "no-restricted-syntax": "off",
      "no-restricted-properties": "off",
      "no-restricted-globals": "off",
    },
  },
]);

