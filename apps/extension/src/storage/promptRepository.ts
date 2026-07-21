import { storageGet, storageSet } from "./local";
import type { CustomPrompt } from "./schema";

export const CUSTOM_PROMPTS_KEY = "customPrompts";

export async function listCustomPrompts(): Promise<CustomPrompt[]> {
  return (await storageGet<CustomPrompt[]>(CUSTOM_PROMPTS_KEY)) ?? [];
}

export async function saveCustomPrompt(prompt: Pick<CustomPrompt, "id" | "label" | "command" | "template">): Promise<void> {
  const prompts = await listCustomPrompts();
  const index = prompts.findIndex((candidate) => candidate.id === prompt.id);
  const now = Date.now();

  if (index === -1) {
    prompts.push({ ...prompt, createdAt: now, updatedAt: now });
  } else {
    prompts[index] = { ...prompts[index], ...prompt, updatedAt: now };
  }
  await storageSet(CUSTOM_PROMPTS_KEY, prompts);
}

export async function deleteCustomPrompt(id: string): Promise<void> {
  const prompts = await listCustomPrompts();
  await storageSet(
    CUSTOM_PROMPTS_KEY,
    prompts.filter((candidate) => candidate.id !== id),
  );
}
