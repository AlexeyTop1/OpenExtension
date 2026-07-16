import { formatPage } from "../formatPage";
import type { ActionDefinition } from "../types";

export const translatePage: ActionDefinition = {
  id: "translate-page",
  label: "Translate",
  requiredFields: ["title", "url", "markdown"],
  command: "translate",
  buildMessages: (context) => [
    {
      role: "user",
      content: `Translate this page into ${context.input || "English"}. Preserve structure and meaning.\n\n${formatPage(context.page)}`,
    },
  ],
};
