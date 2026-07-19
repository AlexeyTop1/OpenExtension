import { formatPage } from "../formatPage";
import type { ActionDefinition } from "../types";

export const summarizeGithubDiff: ActionDefinition = {
  id: "summarize-github-diff",
  label: "Summarize PR",
  requiredFields: ["title", "url", "githubDiff"],
  command: "pr",
  buildMessages: (context) => [
    {
      role: "user",
      content: `Summarize this pull request's changes. Group related changes together, call out anything that looks risky or worth double-checking, and use a few bullet points.\n\n${formatPage(context.page)}`,
    },
  ],
};
