// Marketplace packs are pure data (label/command/template strings), fetched
// from this repo's own `marketplace/` folder — same trust model as the
// remote selector-config: validated as plain strings before use, never
// treated as executable code. See selectorConfig.ts for the fuller
// rationale; the constraint is identical here.
export interface MarketplacePackMeta {
  id: string;
  name: string;
  description: string;
  author: string;
}

export interface MarketplacePromptEntry {
  label: string;
  command: string;
  template: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function isValidPackId(id: string): boolean {
  return /^[a-z0-9-]+$/.test(id);
}

export function isValidPackMetaList(value: unknown): value is MarketplacePackMeta[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (typeof item !== "object" || item === null) return false;
      const meta = item as Record<string, unknown>;
      return (
        isNonEmptyString(meta.id) &&
        isValidPackId(meta.id) &&
        isNonEmptyString(meta.name) &&
        isNonEmptyString(meta.description) &&
        isNonEmptyString(meta.author)
      );
    })
  );
}

export function isValidPromptEntryList(value: unknown): value is MarketplacePromptEntry[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (typeof item !== "object" || item === null) return false;
      const entry = item as Record<string, unknown>;
      return isNonEmptyString(entry.label) && isNonEmptyString(entry.command) && isNonEmptyString(entry.template);
    })
  );
}
