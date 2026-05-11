import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Vite 8/rolldown expects manualChunks as a function.
        manualChunks(id) {
          if (id.includes("@arcgis/core")) {
            return "arcgis";
          }
          return undefined;
        },
      },
    },
  },
});
