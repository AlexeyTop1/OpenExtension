import { PROVIDER_PRESETS } from "@openextension/providers";
import { getProviderConfig } from "../storage/providerRepository";

export interface DefaultProviderSelection {
  providerId: string;
  modelId: string;
}

const FALLBACK: DefaultProviderSelection = {
  providerId: PROVIDER_PRESETS[0].id,
  modelId: PROVIDER_PRESETS[0].fallbackModels[0].id,
};

export async function pickDefaultProviderAndModel(): Promise<DefaultProviderSelection> {
  for (const preset of PROVIDER_PRESETS) {
    const config = await getProviderConfig(preset.id);
    if (config?.apiKey) {
      return { providerId: preset.id, modelId: preset.fallbackModels[0].id };
    }
  }
  return FALLBACK;
}
