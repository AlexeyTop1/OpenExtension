import { formatPage } from "../formatPage";
import type { ActionDefinition } from "../types";

export const summarizeYoutube: ActionDefinition = {
  id: "summarize-youtube",
  label: "Summarize video",
  requiredFields: ["title", "url", "youtubeTranscript"],
  command: "youtube",
  buildMessages: (context) => [
    {
      role: "user",
      content: `Summarize this YouTube video. Use a few bullet points for the key ideas.\n\n${formatPage(context.page)}`,
    },
  ],
};
