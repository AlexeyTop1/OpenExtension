import type { ActionDefinition } from "../types";

export const translateSelection: ActionDefinition = {
  id: "translate-selection",
  label: "Translate",
  requiredFields: ["selection"],
  buildMessages: (context) => [
    {
      role: "user",
      content: `Translate this text into ${context.input || "English"}:\n\n${context.selection ?? ""}`,
    },
  ],
};
