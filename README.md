# OpenExtension

[![License: MIT](https://img.shields.io/github/license/AlexeyTop1/OpenExtension)](./LICENSE)
[![Latest release](https://img.shields.io/github/v/release/AlexeyTop1/OpenExtension)](https://github.com/AlexeyTop1/OpenExtension/releases)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)

**Bring your own AI. Any provider, any site.**

OpenExtension is an open-source browser sidebar that turns any website into an AI-enabled one — without waiting for that site to build an integration, and without being locked into one AI provider.

<!-- TODO: add a screenshot or short GIF of the sidebar in action here -->

## Why

Most AI browser extensions lock you into one model and one vendor. OpenExtension is built around three ideas instead:

- **Bring your own AI** — paste your own API key for OpenAI, Anthropic, Gemini, OpenRouter, DeepSeek, Groq, or a local model via Ollama/LM Studio. Switch models mid-conversation.
- **Developer-first** — a small set of typed packages (`providers`, `context`, `actions`) instead of one monolithic app, so adding a provider or an action is a focused, self-contained change.
- **Works everywhere** — page and text-selection actions work on any site via a generic content-script context API, not a list of specifically-supported domains.

## Features

**Core (v0.1)**

- **Sidebar chat** with streaming responses, chat history, rename/delete, and pinning a chat to a specific page (origin + path) so you can pick it back up later.
- **9 providers**: OpenAI, Anthropic, Gemini, OpenRouter, DeepSeek, Groq, Ollama, LM Studio, and a generic OpenAI-compatible endpoint. Model switcher works mid-chat.
- **Page actions**: Explain, Summarize, Translate, Rewrite, Find issues, Ask about page — pulled from a Readability + Markdown extraction of the current page.
- **Selection actions**: a floating toolbar (and right-click menu) on any selected text — Explain, Translate, Improve, Shorter, Longer, Fix grammar, Custom prompt. The rewrite-style actions can write the result straight back into the field you selected it from.
- **Slash commands** in the prompt box (`/explain`, `/translate`, `/ask`, …) — a third way into the same actions as the buttons and the selection toolbar.
- **Chat controls**: stop generation mid-stream, regenerate the last reply, copy any message.

**Site integrations (v0.2)**

- **PDF Q&A** — every Page Action works on PDFs, including local files (via a file picker, since browser extensions can't read `file://` URLs without a permission most people don't want to grant).
- **Images** — right-click any image for Describe, Extract text (OCR), or Generate alt text (needs a vision-capable model).
- **YouTube** — summarize a video from its transcript.
- **GitHub** — summarize a pull request's diff, or explain a file you're viewing.
- **Gmail** — summarize an open thread, or draft a reply and insert it into the compose box with one click (never sent automatically — you review and send).

**Prompt Library & Marketplace (v0.3)**

- **Prompt Library** — your own slash commands, defined as a template with `{{variables}}`. `{{page}}` and `{{selection}}` fill in automatically from page context; any other name prompts a small form before the prompt runs. Managed from the Options page.
- **Marketplace** — install community-shared prompt packs with one click. No backend: packs are plain JSON files in this repo's [`marketplace/`](./marketplace) folder — anyone can contribute one via a pull request.
- **Voice input** — a mic button in the prompt box using the browser's built-in speech recognition (not a per-provider API, so it works the same regardless of which provider you've configured).
- **Selection toolbar toggle** — turn off the floating toolbar in Options if you'd rather use the right-click menu only.
- No telemetry, no analytics, no backend — everything runs client-side and talks directly to the provider you configured.

See [the roadmap](#roadmap) for what's next.

## Install

OpenExtension isn't on the Chrome Web Store yet. Two ways to try it:

**Prebuilt** — download the `dist.zip` from the [latest release](https://github.com/AlexeyTop1/OpenExtension/releases/latest) and unzip it.

**From source**:

```bash
git clone https://github.com/AlexeyTop1/OpenExtension.git
cd OpenExtension
pnpm install
pnpm build
```

Either way, load it in Chrome: `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select the unzipped folder (or `apps/extension/dist` if you built from source).

## Development

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts Vite in watch mode; reload the unpacked extension after the first run, then most changes hot-reload. Chrome/Chromium only for now (the sidebar uses `chrome.sidePanel`, which Firefox doesn't have).

## Architecture

```
apps/extension/     the actual Chrome extension (background, content script, sidebar, options)
packages/providers/  Provider interface + adapters (OpenAI-compatible, Anthropic, Gemini)
packages/context/    page extraction (Readability + Turndown → markdown)
packages/actions/    ActionDefinition registry shared by buttons, selection toolbar, and slash commands
```

Chat streaming happens in the sidebar itself, not the background service worker — MV3 kills idle service workers, which would otherwise cut off long responses. Background is only responsible for lifecycle, context menus, and routing messages between the sidebar and the active tab's content script.

## Roadmap

v0.1 (core), v0.2 (site integrations), and v0.3 (Prompt Library, Marketplace, voice input) are all done — see Features above. Next up (v0.4): multi-step AI agents, MCP client integration, and scheduled/recurring Page Actions.

## Contributing

Issues and PRs are welcome — this is early and the architecture is still settling, so opening an issue to discuss a larger change before writing code is a good idea.

## Privacy & security

- No telemetry, no analytics, no accounts.
- API keys are stored in `chrome.storage.local` **unencrypted**, similar to a saved browser password — don't use OpenExtension on a shared or untrusted profile. Keys are sent only directly to the provider you configured them for.
- The extension requests a specific provider's network permission only when you save a key for it, not upfront for every supported provider.
- The extension does have one unconditional network permission, scoped to this repo only: it periodically fetches `selectors/config.json` (so a broken site selector can be fixed without shipping a new release) and the Marketplace index/packs (`marketplace/`). Both are validated as plain strings before use and never treated as executable code.

## License

[MIT](./LICENSE)
