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
  content: string;
  createdAt: number;
}

export interface ProviderConfigRecord {
  id: string;
  label: string;
  apiKey?: string;
  baseUrl?: string;
}
