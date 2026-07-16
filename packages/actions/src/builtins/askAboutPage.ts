import { formatPage } from "../formatPage";
import type { ActionDefinition } from "../types";

export const askAboutPage: ActionDefinition = {
  id: "ask-about-page",
  label: "Ask about page",
  requiredFields: ["title", "url", "markdown"],
  command: "ask",
  buildMessages: (context) => [
    {
      role: "user",
      content: `${formatPage(context.page)}\n\nQuestion: ${context.input ?? ""}`,
    },
  ],
};
