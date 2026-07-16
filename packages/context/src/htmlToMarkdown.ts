import TurndownService from "turndown";

const turndownService = new TurndownService({ headingStyle: "atx" });

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}
