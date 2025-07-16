import { configs as pluginJsConfigs } from "@eslint/config-plugin-js";
import globals from "globals";

export default [
  pluginJsConfigs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    rules: {
      semi: ["error", "never"],
    },
  },
];
