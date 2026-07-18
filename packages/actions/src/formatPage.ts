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
  return lines.join("\n");
}
