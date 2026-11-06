import js from "@eslint/js";

export default [
  {
    ignores: ["src/js/lib/TSparticles.confetti.js"]
  },
  {
    files: ["**/*.js"],
    ...js.configs.recommended,
    rules: {
      ...js.configs.recommended.rules,
      "no-undef": "off",
      "no-unused-vars": "off",
      "preserve-caught-error": "off",
      "no-useless-assignment": "off"
    }
  }
];
