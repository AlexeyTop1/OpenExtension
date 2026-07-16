import type { ActionDefinition } from "../types";

export const improveSelection: ActionDefinition = {
  id: "improve-selection",
  label: "Improve",
  requiredFields: ["selection"],
  buildMessages: (context) => [
    {
      role: "user",
      content: `Improve the writing quality of this text, keeping the same meaning. Return only the improved text:\n\n${context.selection ?? ""}`,
    },
  ],
};
