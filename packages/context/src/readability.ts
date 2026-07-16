import { Readability } from "@mozilla/readability";
import { htmlToMarkdown } from "./htmlToMarkdown";

export interface ReadableContent {
  title: string;
  markdown: string;
}

const MAX_CHARS = 100_000;

export function extractReadableContent(doc: Document): ReadableContent | null {
  // Parse a fresh Document from serialized HTML rather than doc.cloneNode(true):
  // some pages (and even our own dev-mode tooling) monkey-patch Node.prototype
  // methods like cloneNode (e.g. custom-elements polyfills), which can throw
  // when called on the live document. DOMParser sidesteps that entirely.
  const clone = new DOMParser().parseFromString(doc.documentElement.outerHTML, "text/html");
  const article = new Readability(clone).parse();
  if (!article?.content) {
    return null;
  }
  return {
    title: article.title || doc.title,
    markdown: htmlToMarkdown(article.content).slice(0, MAX_CHARS),
  };
}
