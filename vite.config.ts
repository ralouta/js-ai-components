import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Keep ArcGIS SDK chunks separate for better caching
        manualChunks: {
          arcgis: ["@arcgis/core"],
        },
      },
    },
  },
});
