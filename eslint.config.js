import tseslint from "typescript-eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: [
      "dist",
      "coverage",
      "node_modules",
      "scripts/**",
      "supabase/functions/**",
      "tests/**",
      "vite.config.ts",
      "tailwind.config.ts",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-floating-promises": "warn",
    },
  },
);
