import { formatPage } from "../formatPage";
import type { ActionDefinition } from "../types";

export const findIssues: ActionDefinition = {
  id: "find-issues",
  label: "Find issues",
  requiredFields: ["title", "url", "markdown"],
  command: "find-issues",
  buildMessages: (context) => [
    {
      role: "user",
      content: `Find factual errors, unclear reasoning, or other issues in this page. List them concretely.\n\n${formatPage(context.page)}`,
    },
  ],
};
