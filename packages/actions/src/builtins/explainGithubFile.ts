import { formatPage } from "../formatPage";
import type { ActionDefinition } from "../types";

export const explainGithubFile: ActionDefinition = {
  id: "explain-github-file",
  label: "Explain file",
  requiredFields: ["title", "url", "githubFile"],
  command: "explainfile",
  buildMessages: (context) => [
    {
      role: "user",
      content: `Explain what this file does. Cover its overall purpose, the key functions/exports, and anything non-obvious about how it works. Use a few bullet points where helpful.\n\n${formatPage(context.page)}`,
    },
  ],
};
