import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset paths so the build works under GitHub Pages (/majlis/) as well as at a site root.
  base: "./",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.tsx"],
    css: { modules: { classNameStrategy: "non-scoped" } },
  },
});
