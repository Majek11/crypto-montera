import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Split heavy vendor libraries into separate chunks so they can be
         * cached independently by the browser between deploys.
         *
         * Chunk strategy:
         *  - react-vendor  : React + React DOM (changes rarely)
         *  - router        : react-router-dom
         *  - motion        : framer-motion (large, changes rarely)
         *  - charts        : recharts (very large, changes rarely)
         *  - ui            : all @radix-ui/* packages
         *  - supabase      : supabase client
         *  - query         : tanstack/react-query
         */
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("react/")) {
              return "react-vendor";
            }
            if (id.includes("react-router")) {
              return "router";
            }
            if (id.includes("framer-motion")) {
              return "motion";
            }
            if (id.includes("recharts") || id.includes("d3-")) {
              return "charts";
            }
            if (id.includes("@radix-ui")) {
              return "ui";
            }
            if (id.includes("@supabase")) {
              return "supabase";
            }
            if (id.includes("@tanstack")) {
              return "query";
            }
          }
        },
      },
    },
    // Raise the warning threshold slightly since we now use manualChunks
    chunkSizeWarningLimit: 600,
  },
}));
