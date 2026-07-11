import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  base: "/",
  server: { port: 5173 },
  build: { outDir: "dist", emptyOutDir: true, sourcemap: true },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
