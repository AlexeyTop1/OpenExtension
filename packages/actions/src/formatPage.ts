import type { PageContext } from "@openextension/context";

export function formatPage(page?: Partial<PageContext>): string {
  if (!page) return "";
  const lines = [`Title: ${page.title ?? "(untitled)"}`, `URL: ${page.url ?? ""}`];
  if (page.markdown) {
    lines.push("", page.markdown);
  }
  if (page.youtubeTranscript) {
    lines.push("", "Transcript:", page.youtubeTranscript);
  }
  if (page.githubDiff) {
    lines.push("", "Diff:", page.githubDiff);
  }
  if (page.githubFile) {
    lines.push("", page.githubFile);
  }
  if (page.emailThread) {
    lines.push("", page.emailThread);
  }
  return lines.join("\n");
}
