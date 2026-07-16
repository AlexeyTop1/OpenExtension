import { storageGet, storageSet } from "./local";
import type { ProviderConfigRecord } from "./schema";

const configKey = (id: string) => `provider_${id}`;

export async function getProviderConfig(id: string): Promise<ProviderConfigRecord | undefined> {
  return storageGet<ProviderConfigRecord>(configKey(id));
}

export async function saveProviderConfig(config: ProviderConfigRecord): Promise<void> {
  await storageSet(configKey(config.id), config);
}
