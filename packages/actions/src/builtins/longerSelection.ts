import type { ActionDefinition } from "../types";

export const longerSelection: ActionDefinition = {
  id: "longer-selection",
  label: "Longer",
  requiredFields: ["selection"],
  buildMessages: (context) => [
    {
      role: "user",
      content: `Expand this text with more detail and explanation. Return only the expanded text:\n\n${context.selection ?? ""}`,
    },
  ],
};
