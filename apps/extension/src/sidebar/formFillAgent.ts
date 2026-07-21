import { createProvider, type ChatMessage } from "@openextension/providers";
import { getProviderConfig } from "../storage/providerRepository";
import type { Chat } from "../storage/schema";

export interface FormFieldInfo {
  ref: string;
  label: string;
  type: string;
  currentValue: string;
}

export interface FormFillStep {
  ref: string;
  label: string;
  value: string;
}

// Uses the conversation itself as context (rather than asking the user to
// retype their info) — the LLM fills in whatever the chat already gives it
// enough information for; every field still gets a step either way, just
// with an empty value when it doesn't know, so the user fills that one in
// themselves in the same approve/edit UI instead of a separate Q&A round trip.
export async function planFormFill(chat: Chat, history: ChatMessage[], fields: FormFieldInfo[]): Promise<FormFillStep[]> {
  const config = await getProviderConfig(chat.providerId);
  const provider = createProvider(chat.providerId, {
    id: chat.providerId,
    apiKey: config?.apiKey,
    baseUrl: config?.baseUrl,
  });

  const fieldList = fields
    .map((field) => `- ${field.ref}: "${field.label}" (${field.type})${field.currentValue ? ` [current: ${field.currentValue}]` : ""}`)
    .join("\n");

  const taskMessage: ChatMessage = {
    role: "user",
    content: `Based on everything discussed in this conversation so far, fill out this web form.

Fields:
${fieldList}

For each field, propose a value if the conversation gives you enough information for it. If you don't have enough information for a field, still include it in your answer with an empty string as the value, so the user can fill it in themselves — don't guess or invent information that wasn't discussed.

Reply with ONLY a JSON array, no other text and no markdown code fences, in this exact shape: [{"ref": "field-0", "value": "..."}]`,
  };

  let assembled = "";
  for await (const chunk of provider.chat({ model: chat.modelId, messages: [...history, taskMessage] })) {
    if (chunk.delta) assembled += chunk.delta;
  }

  const jsonText = assembled
    .trim()
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```$/, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("The AI's response wasn't valid JSON — try again.");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Unexpected response shape from the AI.");
  }

  // Built defensively from `fields`, not from the LLM's output directly — an
  // LLM that omits a field despite the instructions above shouldn't cause
  // that field to silently disappear from the plan.
  const proposedByRef = new Map<string, string>();
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) continue;
    const ref = (item as Record<string, unknown>).ref;
    const value = (item as Record<string, unknown>).value;
    if (typeof ref === "string" && typeof value === "string") proposedByRef.set(ref, value);
  }

  return fields.map((field) => ({ ref: field.ref, label: field.label, value: proposedByRef.get(field.ref) ?? "" }));
}
