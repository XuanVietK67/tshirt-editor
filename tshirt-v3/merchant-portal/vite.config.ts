import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: "src/main.ts",
      name: "VueApp",
      formats: ["es"],
      fileName: () => "vue-app.js",
    },
    rollupOptions: {
      external: [],
    },
  },
});
