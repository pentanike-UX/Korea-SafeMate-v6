import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    /** Any nested Next.js output (e.g. `.claude/worktrees/<id>/.next`). */
    "**/.next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    /**
     * Claude Code / Cursor auxiliary dirs — not application source.
     * - `.claude`: plugins, worktrees, session data (agent copies + their `.next`).
     * - `.cursor`: rules, MCP tool descriptors, etc. (usually JSON/MD, not lint targets).
     * Keep lintable TS under `src/`, `scripts/`, etc. Code placed only under these dirs is skipped.
     */
    ".claude/**",
    ".cursor/**",
    /** bkit runtime / audit logs — present in repo but not ESLint targets */
    ".bkit/**",
  ]),
]);

export default eslintConfig;
