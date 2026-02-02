import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  server: {
    host: "::",
    port: 5173,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "sagar-localhost.sagarkothari88.one",
      "lokesh.sagarkothari88.one",
      "kanchan.sagarkothari88.one",
    ],
  },
  plugins: [react(), tailwindcss()],
});
