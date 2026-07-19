import { storageGet, storageSet } from "../storage/local";
import { DEFAULT_SELECTOR_CONFIG, isValidSelectorConfig, type SelectorConfig } from "./selectorConfig";

const SELECTOR_CONFIG_KEY = "selectorConfig";
const CONFIG_URL = "https://raw.githubusercontent.com/AlexeyTop1/OpenExtension/main/selectors/config.json";

export async function getSelectorConfig(): Promise<SelectorConfig> {
  const stored = await storageGet<SelectorConfig>(SELECTOR_CONFIG_KEY);
  return stored ?? DEFAULT_SELECTOR_CONFIG;
}

// Failures here are expected and silent (offline, first run before the alarm
// fires, GitHub down, blocked by the user's own network/adblock) — whatever
// was last stored (or the bundled default) just keeps being used.
export async function refreshSelectorConfig(): Promise<void> {
  try {
    const res = await fetch(CONFIG_URL, { cache: "no-store" });
    if (!res.ok) return;
    const json: unknown = await res.json();
    if (!isValidSelectorConfig(json)) {
      console.warn("[OpenExtension] Remote selector config failed validation, ignoring it.");
      return;
    }
    await storageSet(SELECTOR_CONFIG_KEY, json);
  } catch (error) {
    console.warn("[OpenExtension] Selector config refresh failed.", error);
  }
}
