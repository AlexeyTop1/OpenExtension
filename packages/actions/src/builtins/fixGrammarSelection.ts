import type { ActionDefinition } from "../types";

export const fixGrammarSelection: ActionDefinition = {
  id: "fix-grammar-selection",
  label: "Fix grammar",
  requiredFields: ["selection"],
  supportsReplace: true,
  buildMessages: (context) => [
    {
      role: "user",
      content: `Fix grammar and spelling mistakes in this text. Return only the corrected text:\n\n${context.selection ?? ""}`,
    },
  ],
};
