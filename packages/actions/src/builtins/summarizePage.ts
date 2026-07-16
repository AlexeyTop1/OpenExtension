import { formatPage } from "../formatPage";
import type { ActionDefinition } from "../types";

export const summarizePage: ActionDefinition = {
  id: "summarize-page",
  label: "Summarize",
  requiredFields: ["title", "url", "markdown"],
  buildMessages: (context) => [
    {
      role: "user",
      content: `Summarize this page. Use a few bullet points for the key takeaways.\n\n${formatPage(context.page)}`,
    },
  ],
};
