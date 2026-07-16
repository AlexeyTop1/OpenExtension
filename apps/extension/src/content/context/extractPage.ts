import { extractReadableContent, type ContextField, type PageContext } from "@openextension/context";

export function extractRequestedContext(fields: ContextField[]): Partial<PageContext> {
  const result: Partial<PageContext> = { extractedAt: Date.now() };

  if (fields.includes("url")) {
    result.url = location.href;
  }
  if (fields.includes("title")) {
    result.title = document.title;
  }

  if (fields.includes("markdown") || fields.includes("html")) {
    const readable = extractReadableContent(document);
    if (readable) {
      result.title = result.title ?? readable.title;
      if (fields.includes("markdown")) {
        result.markdown = readable.markdown;
      }
    }
    if (fields.includes("html")) {
      result.html = document.documentElement.outerHTML.slice(0, 100_000);
    }
  }

  if (fields.includes("selection")) {
    result.selection = window.getSelection()?.toString() || "";
  }

  return result;
}
