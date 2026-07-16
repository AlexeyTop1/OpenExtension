export type ContextField =
  | "title"
  | "url"
  | "html"
  | "markdown"
  | "selection"
  | "images"
  | "pdf"
  | "youtubeTranscript"
  | "githubRepo";

export interface PageContext {
  url: string;
  title: string;
  html?: string;
  markdown?: string;
  selection?: string;
  images?: unknown[];
  pdf?: unknown;
  youtubeTranscript?: string;
  githubRepo?: unknown;
  extractedAt: number;
}
