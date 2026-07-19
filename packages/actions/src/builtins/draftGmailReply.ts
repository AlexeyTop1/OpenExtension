import { formatPage } from "../formatPage";
import type { ActionDefinition } from "../types";

export const draftGmailReply: ActionDefinition = {
  id: "draft-gmail-reply",
  label: "Draft reply",
  requiredFields: ["title", "url", "emailThread"],
  command: "reply",
  buildMessages: (context) => [
    {
      role: "user",
      content: `Draft a reply to this email thread. Match a professional but friendly tone, keep it concise, and skip any greeting/signature placeholders unless the thread's own style calls for them. Reply with ONLY the email body text — no subject line, no commentary.\n\n${formatPage(context.page)}`,
    },
  ],
};
