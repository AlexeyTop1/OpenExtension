export type ContextField =
  | "title"
  | "url"
  | "html"
  | "markdown"
  | "selection"
  | "images"
  | "youtubeTranscript"
  | "githubRepo";

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
  githubRepo?: unknown;
  // Set instead of `markdown` when this is a local (file://) PDF — no
  // extension context can fetch its bytes without a permission most users
  // won't want to grant, so the sidebar prompts to upload the file directly
  // via <input type="file"> instead, using this as the button's filename hint.
  localPdfName?: string;
  extractedAt: number;
}
