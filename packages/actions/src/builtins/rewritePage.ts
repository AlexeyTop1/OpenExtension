import { formatPage } from "../formatPage";
import type { ActionDefinition } from "../types";

export const rewritePage: ActionDefinition = {
  id: "rewrite-page",
  label: "Rewrite",
  requiredFields: ["title", "url", "markdown"],
  command: "rewrite",
  buildMessages: (context) => [
    {
      role: "user",
      content: `Rewrite this page's content to be clearer and more concise, keeping the same meaning.\n\n${formatPage(context.page)}`,
    },
  ],
};
