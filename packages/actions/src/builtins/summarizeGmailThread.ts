import { formatPage } from "../formatPage";
import type { ActionDefinition } from "../types";

export const summarizeGmailThread: ActionDefinition = {
  id: "summarize-gmail-thread",
  label: "Summarize email",
  requiredFields: ["title", "url", "emailThread"],
  command: "email",
  buildMessages: (context) => [
    {
      role: "user",
      content: `Summarize this email thread. Call out any action items or things that need a reply, and use a few bullet points.\n\n${formatPage(context.page)}`,
    },
  ],
};
