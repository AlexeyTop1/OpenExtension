import { OpenAICompatibleProvider, type OpenAICompatiblePreset } from "./openaiCompatible";
import type { Provider, ProviderConfig } from "./types";

export const PROVIDER_PRESETS: OpenAICompatiblePreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    requiresApiKey: true,
    fallbackModels: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o mini" },
    ],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    requiresApiKey: true,
    fallbackModels: [
      { id: "deepseek-chat", label: "DeepSeek Chat (V3)" },
      { id: "deepseek-reasoner", label: "DeepSeek Reasoner (R1)" },
    ],
  },
];

export function createProvider(presetId: string, config: ProviderConfig): Provider {
  const preset = PROVIDER_PRESETS.find((candidate) => candidate.id === presetId);
  if (!preset) {
    throw new Error(`Unknown provider preset: ${presetId}`);
  }
  const provider = new OpenAICompatibleProvider(preset);
  provider.configure(config);
  return provider;
}
