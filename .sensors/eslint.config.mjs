import tsParser from "@typescript-eslint/parser";
import sensorsPlugin from "./eslint-plugin-sensors/index.mjs";

export default [
  {
    ignores: [".svelte-kit/**", "build/**", "dist/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      sensors: sensorsPlugin,
    },
    rules: {
      "sensors/max-file-lines": ["warn", { max: 200 }],
      "sensors/max-function-lines": ["warn", { max: 10 }],
      "sensors/mutated-param-must-be-returned": "warn",
      "sensors/no-classes": "warn",
      "sensors/no-domain-primitives": "warn",
      "sensors/no-local-type-alias": "warn",
      "sensors/no-overbroad-parameter-object": "warn",
      "sensors/no-side-effects-in-map": "warn",
      "sensors/no-single-method-interface": "warn",
      "sensors/no-void-return-functions": ["warn", { allowFiles: ["**/*.test.ts", "**/*.spec.ts"] }],
    },
  },
];
