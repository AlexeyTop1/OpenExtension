export interface LanguagePreference {
  code: string;
  label: string;
}

export function labelForLanguageCode(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export async function getPreferredLanguage(): Promise<LanguagePreference> {
  const languages = await chrome.i18n.getAcceptLanguages();
  const code = languages[0] ?? "en";
  return { code, label: labelForLanguageCode(code) };
}

/** Base ISO 639-1 code detected in `text` (e.g. "en"), or null if undetectable/unreliable. */
export async function detectLanguageCode(text: string): Promise<string | null> {
  if (!text.trim()) return null;
  const result = await chrome.i18n.detectLanguage(text.slice(0, 2000));
  const top = result.languages[0];
  return top && top.percentage >= 50 ? top.language : null;
}
