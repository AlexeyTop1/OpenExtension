import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: "OpenExtension",
  description: "Bring your own AI. Any provider, any site.",
  version: pkg.version,
  action: {},
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  side_panel: {
    default_path: "src/sidebar/index.html",
  },
  options_page: "src/options/index.html",
  permissions: ["storage", "sidePanel"],
  optional_host_permissions: ["https://api.openai.com/*", "https://api.deepseek.com/*"],
});
