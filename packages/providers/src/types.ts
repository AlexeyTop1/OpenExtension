export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ModelInfo {
  id: string;
  label: string;
  contextWindow?: number;
  supportsVision?: boolean;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface ChatChunk {
  delta: string;
  done: boolean;
  finishReason?: string;
}

export interface ProviderConfig {
  id: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface Provider {
  readonly id: string;
  readonly label: string;
  configure(config: ProviderConfig): void;
  listModels(): Promise<ModelInfo[]>;
  chat(request: ChatRequest): AsyncIterable<ChatChunk>;
  embeddings?(input: string[]): Promise<number[][]>;
}
