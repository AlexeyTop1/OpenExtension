import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: "OpenExtension",
  description: "Bring your own AI. Any provider, any site.",
  version: pkg.version,
  action: {},
  background: {
    service_worker: "src/background/serviceWorker.ts",
    type: "module",
  },
  side_panel: {
    default_path: "src/sidebar/index.html",
  },
  options_page: "src/options/index.html",
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/index.ts"],
      run_at: "document_idle",
    },
  ],
  permissions: ["storage", "sidePanel", "tabs", "contextMenus"],
  optional_host_permissions: [
    "https://api.openai.com/*",
    "https://api.anthropic.com/*",
    "https://generativelanguage.googleapis.com/*",
    "https://openrouter.ai/*",
    "https://api.deepseek.com/*",
    "https://api.groq.com/*",
    "http://localhost/*",
    "http://127.0.0.1/*",
    // Broad, optional-only patterns backing the "Custom (OpenAI-compatible)" preset,
    // whose domain isn't known ahead of time. Never granted by default — only
    // requested at runtime when the user actually saves a custom endpoint.
    "https://*/*",
    "http://*/*",
  ],
});
