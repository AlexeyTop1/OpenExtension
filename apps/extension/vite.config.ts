import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config";

const HMR_PORT = 5173;

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  server: {
    port: HMR_PORT,
    strictPort: true,
    ws: {
      protocol: "ws",
      host: "localhost",
      port: HMR_PORT,
    },
  },
});
