export type MessageContentPart = { type: "text"; text: string } | { type: "image"; dataUrl: string };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  // A plain string for ordinary chat/action turns; an array of parts for
  // multimodal turns (image actions attach a `data:` URL alongside the
  // instruction text — every provider adapter normalizes this into its own
  // wire format).
  content: string | MessageContentPart[];
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

export type ProviderKind = "openai-compatible" | "anthropic" | "gemini";

export interface ProviderPreset {
  id: string;
  label: string;
  kind: ProviderKind;
  baseUrl: string;
  requiresApiKey: boolean;
  /** Whether the Options UI should let the user override baseUrl (local/self-hosted or fully custom endpoints). */
  editableBaseUrl?: boolean;
  fallbackModels: ModelInfo[];
  /**
   * Set to `false` only for providers with categorically no vision-capable
   * models (e.g. DeepSeek). Left unset for providers that are mixed
   * (OpenRouter/Groq/Ollama/LM Studio/Custom depend entirely on which model
   * the user picked) — per-model vision detection isn't worth the constant
   * upkeep, so those are just left to try and surface the provider's own
   * error if the chosen model can't handle images.
   */
  supportsVision?: false;
}
