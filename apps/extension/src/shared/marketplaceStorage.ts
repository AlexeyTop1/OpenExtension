import { storageGet, storageSet } from "../storage/local";
import {
  isValidPackId,
  isValidPackMetaList,
  isValidPromptEntryList,
  type MarketplacePackMeta,
  type MarketplacePromptEntry,
} from "./marketplace";

const INDEX_KEY = "marketplaceIndex";
const BASE_URL = "https://raw.githubusercontent.com/AlexeyTop1/OpenExtension/main/marketplace";

export async function getMarketplaceIndex(): Promise<MarketplacePackMeta[]> {
  return (await storageGet<MarketplacePackMeta[]>(INDEX_KEY)) ?? [];
}

// Failures here are expected and silent (offline, unreleased, GitHub down) —
// whatever was last cached (or an empty list on first run) keeps being used.
export async function refreshMarketplaceIndex(): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/index.json`, { cache: "no-store" });
    if (!res.ok) return;
    const json: unknown = await res.json();
    if (!isValidPackMetaList(json)) {
      console.warn("[OpenExtension] Marketplace index failed validation, ignoring it.");
      return;
    }
    await storageSet(INDEX_KEY, json);
  } catch (error) {
    console.warn("[OpenExtension] Marketplace index refresh failed.", error);
  }
}

export async function fetchMarketplacePack(id: string): Promise<MarketplacePromptEntry[] | null> {
  if (!isValidPackId(id)) return null;
  try {
    const res = await fetch(`${BASE_URL}/packs/${id}.json`, { cache: "no-store" });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    if (!isValidPromptEntryList(json)) {
      console.warn(`[OpenExtension] Marketplace pack "${id}" failed validation.`);
      return null;
    }
    return json;
  } catch (error) {
    console.warn(`[OpenExtension] Failed to fetch marketplace pack "${id}".`, error);
    return null;
  }
}
