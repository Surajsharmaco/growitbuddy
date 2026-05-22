import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

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

const devPlugins = async () => {
  if (isProduction) return [];
  const plugins = [];
  const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal");
  plugins.push(runtimeErrorOverlay.default());
  if (process.env.REPL_ID !== undefined) {
    const cartographer = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographer.cartographer({ root: path.resolve(import.meta.dirname, "..") }));
    const devBanner = await import("@replit/vite-plugin-dev-banner");
    plugins.push(devBanner.devBanner());
  }
  return plugins;
};

export default defineConfig(async () => ({
  base: basePath ?? "/",
  plugins: [
    react(),
    tailwindcss(),
    ...(await devPlugins()),
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
    minify: "esbuild",
    target: "es2020",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("react/")) return "react-vendor";
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("three") || id.includes("@react-three")) return "three-vendor";
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("wouter")) return "router";
            if (id.includes("exceljs") || id.includes("xlsx")) return "spreadsheet";
            if (id.includes("@radix-ui")) return "radix";
            if (id.includes("recharts") || id.includes("d3-")) return "charts";
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
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
}));
