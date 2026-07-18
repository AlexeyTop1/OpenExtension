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

export function parseDataUrl(dataUrl: string): { mediaType: string; base64: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Expected a base64 data: URL for image content.");
  }
  return { mediaType: match[1], base64: match[2] };
}
