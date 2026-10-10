import eslint from "@eslint/js"
import tseslint from "typescript-eslint"

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "max-len": [
        "error",
        {
          code: 80,
          tabWidth: 2,
          ignoreUrls: true,
        },
      ],
    },
  },
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },
)
