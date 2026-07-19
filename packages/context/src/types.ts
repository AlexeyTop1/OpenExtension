export type ContextField =
  | "title"
  | "url"
  | "html"
  | "markdown"
  | "selection"
  | "images"
  | "youtubeTranscript"
  | "githubDiff"
  | "emailThread";

export interface PageContext {
  url: string;
  title: string;
  html?: string;
  // PDFs are folded into `markdown` (content-script sources it from either
  // Readability or PDF text extraction, transparently to callers) rather
  // than getting a separate field — every existing Page Action already
  // reads `markdown`, so none of them needed to change to also work on PDFs.
  markdown?: string;
  selection?: string;
  images?: unknown[];
  youtubeTranscript?: string;
  // A GitHub pull request's changed-file diffs, formatted as fenced diff
  // blocks per file — GitHub's diff table isn't article-like content, so
  // Readability wouldn't produce anything useful; this is scraped directly.
  githubDiff?: string;
  // A Gmail thread's message(s), scraped from the DOM the same way as
  // githubDiff — Gmail is a fully authenticated SPA with no article-like
  // structure Readability could use.
  emailThread?: string;
  // Set instead of `markdown` when this is a local (file://) PDF — no
  // extension context can fetch its bytes without a permission most users
  // won't want to grant, so the sidebar prompts to upload the file directly
  // via <input type="file"> instead, using this as the button's filename hint.
  localPdfName?: string;
  extractedAt: number;
}
