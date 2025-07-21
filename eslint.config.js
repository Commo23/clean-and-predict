import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Règles TypeScript améliorées
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-empty-function": "warn",
      
      // Règles générales
      "no-console": "warn",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      
      // Règles de performance
      "react-hooks/exhaustive-deps": "warn",
      
      // Règles de sécurité
      "no-eval": "error",
      "no-implied-eval": "error",
    },
  },
  {
    // Configuration spécifique pour les fichiers de configuration
    files: ["*.config.{js,ts}", "vite.config.ts", "tailwind.config.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
    },
  }
);
