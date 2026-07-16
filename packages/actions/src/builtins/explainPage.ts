import { formatPage } from "../formatPage";
import type { ActionDefinition } from "../types";

export const explainPage: ActionDefinition = {
  id: "explain-page",
  label: "Explain page",
  requiredFields: ["title", "url", "markdown"],
  command: "explain",
  buildMessages: (context) => [
    {
      role: "user",
      content: `Explain what this page is about in plain language.\n\n${formatPage(context.page)}`,
    },
  ],
};
