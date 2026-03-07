import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("react/")) return "react-vendor";
            if (id.includes("react-router")) return "router";
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("recharts") || id.includes("d3-")) return "charts";
            if (id.includes("@radix-ui")) return "ui";
            if (id.includes("@supabase")) return "supabase";
            if (id.includes("@tanstack")) return "query";
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
