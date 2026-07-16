import { PROVIDER_PRESETS, type ProviderPreset } from "@openextension/providers";
import { getProviderConfig } from "../storage/providerRepository";
import type { ProviderConfigRecord } from "../storage/schema";

export interface DefaultProviderSelection {
  providerId: string;
  modelId: string;
}

function isConfigured(preset: ProviderPreset, config: ProviderConfigRecord | undefined): boolean {
  if (!config) return false;
  return preset.requiresApiKey ? Boolean(config.apiKey) : true;
}

export async function listConfiguredProviders(): Promise<
  Array<{ preset: ProviderPreset; config: ProviderConfigRecord }>
> {
  const results: Array<{ preset: ProviderPreset; config: ProviderConfigRecord }> = [];
  for (const preset of PROVIDER_PRESETS) {
    const config = await getProviderConfig(preset.id);
    if (isConfigured(preset, config)) {
      results.push({ preset, config: config! });
    }
  }
  return results;
}

export async function pickDefaultProviderAndModel(): Promise<DefaultProviderSelection> {
  const configured = await listConfiguredProviders();
  const first = configured[0];
  if (first) {
    return { providerId: first.preset.id, modelId: first.preset.fallbackModels[0]?.id ?? "" };
  }
  return {
    providerId: PROVIDER_PRESETS[0].id,
    modelId: PROVIDER_PRESETS[0].fallbackModels[0].id,
  };
}
