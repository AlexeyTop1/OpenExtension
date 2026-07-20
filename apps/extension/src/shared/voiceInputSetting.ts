import { storageGet, storageSet } from "../storage/local";

const VOICE_INPUT_LANGUAGE_KEY = "voiceInputLanguage";

// Empty/unset means "auto" — falls back to getPreferredLanguage() (Chrome's
// configured content-language list), which doesn't always match what the
// user actually speaks, so this lets them override it directly.
export async function getVoiceInputLanguage(): Promise<string> {
  return (await storageGet<string>(VOICE_INPUT_LANGUAGE_KEY)) ?? "";
}

export async function setVoiceInputLanguage(code: string): Promise<void> {
  await storageSet(VOICE_INPUT_LANGUAGE_KEY, code.trim());
}
