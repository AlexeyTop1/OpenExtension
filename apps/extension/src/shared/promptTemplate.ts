// `{{page}}` and `{{selection}}` are reserved: they're auto-filled from page
// context rather than collected from the user. Any other `{{name}}` becomes
// a field in the mini-form shown before running the prompt.
const RESERVED_VARIABLES = new Set(["page", "selection"]);

export function extractTemplateVariables(template: string): string[] {
  const names = new Set<string>();
  for (const match of template.matchAll(/\{\{(\w+)\}\}/g)) {
    names.add(match[1]);
  }
  return Array.from(names);
}

export function fillableVariables(template: string): string[] {
  return extractTemplateVariables(template).filter((name) => !RESERVED_VARIABLES.has(name));
}

export function usesReservedVariable(template: string, name: "page" | "selection"): boolean {
  return extractTemplateVariables(template).includes(name);
}

export function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => values[name] ?? "");
}

export function isValidCommandSlug(command: string): boolean {
  return /^[a-z0-9-]+$/.test(command);
}
