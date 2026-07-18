import type { MessageContentPart } from "@openextension/providers";

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  providerId: string;
  modelId: string;
  pinnedUrl?: string | null;
}

export interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  // An array of parts for image-action turns (attaches the image alongside
  // the instruction text) so regenerate/follow-ups still have it; plain
  // string for every other turn.
  content: string | MessageContentPart[];
  createdAt: number;
}

export interface ProviderConfigRecord {
  id: string;
  label: string;
  apiKey?: string;
  baseUrl?: string;
}
