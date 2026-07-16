import type { ActionDefinition } from "../types";

export const explainSelection: ActionDefinition = {
  id: "explain-selection",
  label: "Explain",
  requiredFields: ["selection"],
  buildMessages: (context) => [
    {
      role: "user",
      content: `Explain this text:\n\n${context.selection ?? ""}`,
    },
  ],
};
