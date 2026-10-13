import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: resolve(projectRoot, "frontend"),
  build: {
    outDir: resolve(projectRoot, "static", "dist"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/liquid-glass.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith(".css")
            ? "assets/liquid-glass.css"
            : "assets/[name][extname]",
      },
    },
  },
});
