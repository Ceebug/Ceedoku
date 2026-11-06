import js from "@eslint/js";

export default [
  {
    files: ["**/*.js"],
    ...js.configs.recommended,
    rules: {
      ...js.configs.recommended.rules,
      "no-undef": "off",
      "no-unused-vars": "off"
    }
  }
];
