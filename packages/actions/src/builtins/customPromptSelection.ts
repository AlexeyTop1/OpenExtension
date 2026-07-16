import type { ActionDefinition } from "../types";

export const customPromptSelection: ActionDefinition = {
  id: "custom-prompt-selection",
  label: "Custom Prompt",
  requiredFields: ["selection"],
  buildMessages: (context) => [
    {
      role: "user",
      content: `${context.input ?? ""}\n\n${context.selection ?? ""}`,
    },
  ],
};
