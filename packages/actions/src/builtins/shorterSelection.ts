import type { ActionDefinition } from "../types";

export const shorterSelection: ActionDefinition = {
  id: "shorter-selection",
  label: "Shorter",
  requiredFields: ["selection"],
  supportsReplace: true,
  buildMessages: (context) => [
    {
      role: "user",
      content: `Make this text shorter and more concise, keeping the key meaning. Return only the shortened text:\n\n${context.selection ?? ""}`,
    },
  ],
};
