import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const isBuildMode = process.argv.some((a) => a === "build");
const isProduction = process.env.NODE_ENV === "production";

const rawPort = process.env.PORT;
if (!rawPort && !isBuildMode) {
  throw new Error("PORT environment variable is required but was not provided.");
}
const port = Number(rawPort ?? "3000");
if (!isBuildMode && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;
if (!basePath && !isBuildMode) {
  throw new Error("BASE_PATH environment variable is required but was not provided.");
}

export default defineConfig({
  base: basePath ?? "/",
  plugins: [
    react(),
    tailwindcss(),
    // Only include dev-only plugins outside production builds
    ...(!isProduction ? [runtimeErrorOverlay()] : []),
    ...(!isProduction && process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({ root: path.resolve(import.meta.dirname, "..") }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom", "@react-three/fiber", "@react-three/drei", "three"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // esbuild is faster and produces smaller output than the default
    minify: "esbuild",
    target: "es2020",
    cssMinify: true,
    // Raise warning threshold — lazy loading naturally creates many small chunks
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
