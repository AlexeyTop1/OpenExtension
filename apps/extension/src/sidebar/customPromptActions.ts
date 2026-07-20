import { formatPage, type ActionDefinition } from "@openextension/actions";
import type { ContextField } from "@openextension/context";
import type { CustomPrompt } from "../storage/schema";
import { renderTemplate, usesReservedVariable } from "../shared/promptTemplate";

// "custom-" prefix lets the sidebar tell a Prompt Library action apart from
// a built-in one (built-in ids are plain slugs like "explain-page") without
// needing a separate registry to check membership against.
export const CUSTOM_PROMPT_ID_PREFIX = "custom-";

export function customPromptActionId(promptId: string): string {
  return `${CUSTOM_PROMPT_ID_PREFIX}${promptId}`;
}

export function customPromptToAction(prompt: CustomPrompt): ActionDefinition {
  const requiredFields: ContextField[] = [];
  if (usesReservedVariable(prompt.template, "page")) requiredFields.push("title", "url", "markdown");
  if (usesReservedVariable(prompt.template, "selection")) requiredFields.push("selection");

  return {
    id: customPromptActionId(prompt.id),
    label: prompt.label,
    command: prompt.command,
    requiredFields,
    buildMessages: (context) => [
      {
        role: "user",
        content: renderTemplate(prompt.template, {
          ...(context.variables ?? {}),
          page: formatPage(context.page),
          selection: context.selection ?? "",
        }),
      },
    ],
  };
}
