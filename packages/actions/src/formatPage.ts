import type { PageContext } from "@openextension/context";

export function formatPage(page?: Partial<PageContext>): string {
  if (!page) return "";
  const lines = [`Title: ${page.title ?? "(untitled)"}`, `URL: ${page.url ?? ""}`];
  if (page.markdown) {
    lines.push("", page.markdown);
  }
  return lines.join("\n");
}
