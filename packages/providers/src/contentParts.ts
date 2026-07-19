import type { MessageContentPart } from "./types";

// System-prompt text is always plain in this codebase, but the type is shared
// with user turns (which can be multimodal) — this keeps that extraction honest.
export function textOnly(content: string | MessageContentPart[]): string {
  if (typeof content === "string") return content;
  return content
    .filter((part): part is Extract<MessageContentPart, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("\n\n");
}

// Chat history can carry an image turn from earlier in the conversation even
// after the user switches to (or was already on) a provider with no vision
// models — the whole history gets resent on every turn, so a stale image
// part would otherwise break completely unrelated follow-up messages.
export function stripImagesForTextOnlyProvider(content: string | MessageContentPart[]): string {
  if (typeof content === "string") return content;
  return content
    .map((part) => (part.type === "text" ? part.text : "[image attached — omitted, this provider doesn't support image input]"))
    .join("\n\n");
}

export function parseDataUrl(dataUrl: string): { mediaType: string; base64: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Expected a base64 data: URL for image content.");
  }
  return { mediaType: match[1], base64: match[2] };
}
