import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";
import { OpenAICompatibleProvider } from "./openaiCompatible";
import type { Provider, ProviderConfig, ProviderPreset } from "./types";

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    kind: "openai-compatible",
    baseUrl: "https://api.openai.com/v1",
    requiresApiKey: true,
    fallbackModels: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o mini" },
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic",
    kind: "anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    requiresApiKey: true,
    fallbackModels: [
      { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
      { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ],
  },
  {
    id: "gemini",
    label: "Gemini",
    kind: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    requiresApiKey: true,
    fallbackModels: [
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    kind: "openai-compatible",
    baseUrl: "https://openrouter.ai/api/v1",
    requiresApiKey: true,
    fallbackModels: [
      { id: "openai/gpt-4o", label: "GPT-4o (via OpenRouter)" },
      { id: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5 (via OpenRouter)" },
    ],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    kind: "openai-compatible",
    baseUrl: "https://api.deepseek.com/v1",
    requiresApiKey: true,
    supportsVision: false,
    fallbackModels: [
      { id: "deepseek-chat", label: "DeepSeek Chat (V3)" },
      { id: "deepseek-reasoner", label: "DeepSeek Reasoner (R1)" },
    ],
  },
  {
    id: "groq",
    label: "Groq",
    kind: "openai-compatible",
    baseUrl: "https://api.groq.com/openai/v1",
    requiresApiKey: true,
    fallbackModels: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill Llama 70B" },
    ],
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    kind: "openai-compatible",
    baseUrl: "http://localhost:11434/v1",
    requiresApiKey: false,
    editableBaseUrl: true,
    fallbackModels: [],
  },
  {
    id: "lmstudio",
    label: "LM Studio (local)",
    kind: "openai-compatible",
    baseUrl: "http://localhost:1234/v1",
    requiresApiKey: false,
    editableBaseUrl: true,
    fallbackModels: [],
  },
  {
    id: "custom",
    label: "Custom (OpenAI-compatible)",
    kind: "openai-compatible",
    baseUrl: "",
    requiresApiKey: false,
    editableBaseUrl: true,
    fallbackModels: [],
  },
];

export function createProvider(presetId: string, config: ProviderConfig): Provider {
  const preset = PROVIDER_PRESETS.find((candidate) => candidate.id === presetId);
  if (!preset) {
    throw new Error(`Unknown provider preset: ${presetId}`);
  }

  const provider: Provider =
    preset.kind === "anthropic"
      ? new AnthropicProvider(preset)
      : preset.kind === "gemini"
        ? new GeminiProvider(preset)
        : new OpenAICompatibleProvider(preset);

  provider.configure(config);
  return provider;
}
